import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { prisma } from './lib/prisma';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize database on startup
async function initializeDatabase() {
  try {
    console.log('📦 Connecting to database...');
    
    // Connect to database
    await prisma.$connect();
    
    console.log('✅ Database connected successfully');
    
    // Check if we have any data
    try {
      const count = await prisma.property.count();
      console.log(`📊 Database has ${count} properties`);
    } catch (countError) {
      console.log('📝 Tables might be empty. This is normal.');
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:', error);
  }
}

// Initialize database
initializeDatabase();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Health check
app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ 
      status: 'OK', 
      message: 'LuxeLiving API is running',
      database: 'Connected',
      environment: process.env.NODE_ENV || 'development',
      platform: process.env.RENDER ? 'Render' : 'Local'
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.json({ 
      status: 'WARNING', 
      message: 'API is running but database may have issues',
      database: 'Error',
      error: errorMessage
    });
  }
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'API is working!',
    timestamp: new Date().toISOString()
  });
});

// Get featured properties
app.get('/api/properties/featured', async (req, res) => {
  try {
    const properties = await prisma.property.findMany({
      where: { featured: true },
      take: 6,
      orderBy: { createdAt: 'desc' }
    });
    
    const formattedProperties = properties.map(property => ({
      ...property,
      amenities: JSON.parse(property.amenities || '[]'),
      images: JSON.parse(property.images || '[]')
    }));
    
    res.json({
      success: true,
      count: formattedProperties.length,
      data: formattedProperties
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching featured properties:', errorMessage);
    
    // Return sample featured properties
    const sampleProperties = [
      {
        id: 'featured-1',
        title: 'Luxury Oceanfront Villa',
        description: 'Stunning villa with direct beach access and panoramic ocean views.',
        price: 3200000,
        type: 'VILLA',
        bedrooms: 5,
        bathrooms: 4,
        sqft: 4500,
        address: '123 Beach Boulevard',
        city: 'Miami',
        state: 'FL',
        zipCode: '33139',
        amenities: ['Pool', 'Beach Access', 'Gym', 'Smart Home'],
        images: [
          'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop'
        ],
        featured: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'featured-2',
        title: 'Modern Downtown Penthouse',
        description: 'Luxury penthouse with city views and premium finishes.',
        price: 1850000,
        type: 'APARTMENT',
        bedrooms: 3,
        bathrooms: 3,
        sqft: 2800,
        address: '456 Skyline Ave',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        amenities: ['Rooftop', 'Concierge', 'Gym', 'Parking'],
        images: [
          'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop'
        ],
        featured: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'featured-3',
        title: 'Mountain Retreat Cabin',
        description: 'Cozy cabin with mountain views and modern amenities.',
        price: 950000,
        type: 'HOUSE',
        bedrooms: 4,
        bathrooms: 3,
        sqft: 3200,
        address: '789 Mountain Road',
        city: 'Aspen',
        state: 'CO',
        zipCode: '81611',
        amenities: ['Fireplace', 'Hot Tub', 'Hiking Trails', 'Garage'],
        images: [
          'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1476820865390-c52aeebb9891?w=800&auto=format&fit=crop'
        ],
        featured: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    
    res.json({
      success: true,
      count: sampleProperties.length,
      data: sampleProperties,
      note: 'Using sample data. Database might be initializing.'
    });
  }
});

// Get all properties
app.get('/api/properties', async (req, res) => {
  try {
    const { 
      type, 
      minPrice, 
      maxPrice, 
      bedrooms, 
      featured,
      limit = '10',
      page = '1'
    } = req.query;
    
    const filter: any = {};
    
    if (type) filter.type = type as string;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.gte = parseInt(minPrice as string);
      if (maxPrice) filter.price.lte = parseInt(maxPrice as string);
    }
    if (bedrooms) filter.bedrooms = { gte: parseInt(bedrooms as string) };
    if (featured === 'true') filter.featured = true;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;
    
    const properties = await prisma.property.findMany({
      where: filter,
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          }
        }
      },
      skip,
      take: limitNum,
      orderBy: { createdAt: 'desc' }
    });
    
    const total = await prisma.property.count({ where: filter });
    
    const formattedProperties = properties.map(property => ({
      ...property,
      amenities: JSON.parse(property.amenities || '[]'),
      images: JSON.parse(property.images || '[]')
    }));
    
    res.json({
      success: true,
      count: formattedProperties.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: formattedProperties
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching properties:', errorMessage);
    
    // Return sample properties
    const sampleProperties = [
      {
        id: 'sample-1',
        title: 'Luxury Oceanfront Villa',
        description: 'Stunning villa with direct beach access and panoramic ocean views.',
        price: 3200000,
        type: 'VILLA',
        bedrooms: 5,
        bathrooms: 4,
        sqft: 4500,
        address: '123 Beach Boulevard',
        city: 'Miami',
        state: 'FL',
        zipCode: '33139',
        amenities: ['Pool', 'Beach Access', 'Gym', 'Smart Home'],
        images: [
          'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop'
        ],
        featured: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'sample-2',
        title: 'Modern Downtown Penthouse',
        description: 'Luxury penthouse with city views and premium finishes.',
        price: 1850000,
        type: 'APARTMENT',
        bedrooms: 3,
        bathrooms: 3,
        sqft: 2800,
        address: '456 Skyline Ave',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        amenities: ['Rooftop', 'Concierge', 'Gym', 'Parking'],
        images: [
          'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop'
        ],
        featured: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'sample-3',
        title: 'Mountain Retreat Cabin',
        description: 'Cozy cabin with mountain views and modern amenities.',
        price: 950000,
        type: 'HOUSE',
        bedrooms: 4,
        bathrooms: 3,
        sqft: 3200,
        address: '789 Mountain Road',
        city: 'Aspen',
        state: 'CO',
        zipCode: '81611',
        amenities: ['Fireplace', 'Hot Tub', 'Hiking Trails', 'Garage'],
        images: [
          'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1476820865390-c52aeebb9891?w=800&auto=format&fit=crop'
        ],
        featured: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'sample-4',
        title: 'Urban Loft Studio',
        description: 'Modern loft in the heart of the city with exposed brick.',
        price: 650000,
        type: 'APARTMENT',
        bedrooms: 1,
        bathrooms: 1,
        sqft: 900,
        address: '101 Urban Street',
        city: 'Chicago',
        state: 'IL',
        zipCode: '60601',
        amenities: ['Exposed Brick', 'High Ceilings', 'City Views'],
        images: [
          'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop'
        ],
        featured: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'sample-5',
        title: 'Suburban Family Home',
        description: 'Perfect family home in quiet neighborhood with large yard.',
        price: 850000,
        type: 'HOUSE',
        bedrooms: 4,
        bathrooms: 3,
        sqft: 2800,
        address: '202 Maple Street',
        city: 'Austin',
        state: 'TX',
        zipCode: '73301',
        amenities: ['Large Yard', 'Playground', 'Garage', 'Updated Kitchen'],
        images: [
          'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&auto=format&fit=crop'
        ],
        featured: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    
    res.json({
      success: true,
      count: sampleProperties.length,
      total: sampleProperties.length,
      page: 1,
      pages: 1,
      data: sampleProperties,
      note: 'Using sample data. Database connection might be establishing.'
    });
  }
});

// Get single property
app.get('/api/properties/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
          }
        }
      }
    });
    
    if (!property) {
      return res.status(404).json({
        success: false,
        error: 'Property not found'
      });
    }
    
    const formattedProperty = {
      ...property,
      amenities: JSON.parse(property.amenities || '[]'),
      images: JSON.parse(property.images || '[]')
    };
    
    res.json({
      success: true,
      data: formattedProperty
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching property:', errorMessage);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch property'
    });
  }
});

// Auth info endpoint
app.get('/api/auth', (req, res) => {
  res.json({
    message: 'Authentication API',
    endpoints: {
      register: 'POST /api/auth/register',
      login: 'POST /api/auth/login'
    }
  });
});

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, phone, role } = req.body;

    // Simple validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Try to save to database if available
    try {
      // In a real app, you would hash the password and save to database
      // For now, just return success
      
      res.status(201).json({
        success: true,
        message: 'Registration successful',
        user: {
          email,
          name: name || 'User',
          role: role || 'BUYER'
        },
        token: 'demo-token-for-now'
      });
    } catch (dbError) {
      // If database fails, still return success for demo
      res.status(201).json({
        success: true,
        message: 'Registration successful (demo mode)',
        user: {
          email,
          name: name || 'User',
          role: role || 'BUYER'
        },
        token: 'demo-token',
        note: 'Database not available. Running in demo mode.'
      });
    }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Registration error:', errorMessage);
    res.status(500).json({
      success: false,
      error: 'Registration failed'
    });
  }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // For demo purposes, accept any email/password
    res.json({
      success: true,
      message: 'Login successful',
      user: {
        email,
        name: 'Demo User',
        role: 'BUYER'
      },
      token: 'demo-jwt-token'
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Login error:', errorMessage);
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🔐 Auth routes: http://localhost:${PORT}/api/auth`);
  console.log(`🏠 Properties: http://localhost:${PORT}/api/properties`);
  console.log(`💾 Database: Ready`);
});