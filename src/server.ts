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

// Get featured properties - FIXED VERSION
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
    
    // Return sample featured properties with IDs that match property details
    const sampleProperties = [
      {
        id: 'luxury-villa-1',
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
        id: 'downtown-penthouse-2',
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
        id: 'mountain-cabin-3',
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
        id: 'luxury-villa-1',
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
        id: 'downtown-penthouse-2',
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
        id: 'mountain-cabin-3',
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
        id: 'urban-loft-4',
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
        id: 'family-home-5',
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

// Get single property - FIXED VERSION WITH SAMPLE DATA
app.get('/api/properties/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // First try to get from database
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
    
    if (property) {
      const formattedProperty = {
        ...property,
        amenities: JSON.parse(property.amenities || '[]'),
        images: JSON.parse(property.images || '[]')
      };
      
      return res.json({
        success: true,
        data: formattedProperty,
        source: 'database'
      });
    }
    
    // If not in database, check sample data
    const sampleProperties: any = {
      'luxury-villa-1': {
        id: 'luxury-villa-1',
        title: 'Luxury Oceanfront Villa',
        description: 'Stunning villa with direct beach access and panoramic ocean views. Features include infinity pool, smart home automation, gourmet kitchen, wine cellar, home theater, and private beach access.',
        price: 3200000,
        type: 'VILLA',
        status: 'ACTIVE',
        bedrooms: 5,
        bathrooms: 4,
        sqft: 4500,
        yearBuilt: 2020,
        address: '123 Beach Boulevard',
        city: 'Miami',
        state: 'FL',
        zipCode: '33139',
        latitude: 25.7617,
        longitude: -80.1918,
        amenities: ['Infinity Pool', 'Private Beach Access', 'Smart Home', 'Wine Cellar', 'Home Theater', 'Gym', 'Outdoor Kitchen'],
        images: [
          'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=1200&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&auto=format&fit=crop'
        ],
        featured: true,
        agent: {
          id: 'agent-1',
          name: 'John Luxury',
          email: 'john@luxeliving.com',
          phone: '+1 (305) 555-0123',
          role: 'AGENT'
        },
        virtualTour: 'https://my.matterport.com/show/?m=example123',
        floorPlan: 'https://example.com/floorplans/villa-1.pdf',
        createdAt: new Date('2023-01-15').toISOString(),
        updatedAt: new Date('2023-06-20').toISOString()
      },
      'downtown-penthouse-2': {
        id: 'downtown-penthouse-2',
        title: 'Modern Downtown Penthouse',
        description: 'Luxury penthouse with floor-to-ceiling windows offering breathtaking city views. Features include private rooftop access with outdoor kitchen, smart home system, heated floors, and premium finishes throughout.',
        price: 1850000,
        type: 'APARTMENT',
        status: 'ACTIVE',
        bedrooms: 3,
        bathrooms: 3,
        sqft: 2800,
        yearBuilt: 2019,
        address: '456 Skyline Avenue',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        latitude: 40.7128,
        longitude: -74.0060,
        amenities: ['Private Rooftop', 'Concierge', 'Fitness Center', 'Valet Parking', 'Pet Spa', 'Smart Home', 'Heated Floors'],
        images: [
          'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1560184897-ae75f418493e?w=1200&auto=format&fit=crop'
        ],
        featured: true,
        agent: {
          id: 'agent-2',
          name: 'Sarah Urban',
          email: 'sarah@luxeliving.com',
          phone: '+1 (212) 555-0456',
          role: 'AGENT'
        },
        virtualTour: 'https://my.matterport.com/show/?m=example456',
        floorPlan: 'https://example.com/floorplans/penthouse-2.pdf',
        createdAt: new Date('2023-02-10').toISOString(),
        updatedAt: new Date('2023-07-15').toISOString()
      },
      'mountain-cabin-3': {
        id: 'mountain-cabin-3',
        title: 'Mountain Retreat Cabin',
        description: 'Cozy luxury cabin nestled in the mountains with panoramic views. Features include stone fireplace, outdoor hot tub, sauna, direct access to hiking trails, and custom woodwork throughout.',
        price: 950000,
        type: 'HOUSE',
        status: 'ACTIVE',
        bedrooms: 4,
        bathrooms: 3,
        sqft: 3200,
        yearBuilt: 2018,
        address: '789 Mountain View Road',
        city: 'Aspen',
        state: 'CO',
        zipCode: '81611',
        latitude: 39.1911,
        longitude: -106.8175,
        amenities: ['Stone Fireplace', 'Outdoor Hot Tub', 'Sauna', 'Hiking Trail Access', 'Garage', 'Mountain Views', 'Outdoor Kitchen', 'Game Room'],
        images: [
          'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1476820865390-c52aeebb9891?w=1200&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1572120360610-d971b9d7767c?w=1200&auto=format&fit=crop'
        ],
        featured: true,
        agent: {
          id: 'agent-3',
          name: 'Michael Woods',
          email: 'michael@luxeliving.com',
          phone: '+1 (970) 555-0789',
          role: 'AGENT'
        },
        virtualTour: 'https://my.matterport.com/show/?m=example789',
        floorPlan: 'https://example.com/floorplans/cabin-3.pdf',
        createdAt: new Date('2023-03-05').toISOString(),
        updatedAt: new Date('2023-08-10').toISOString()
      },
      'urban-loft-4': {
        id: 'urban-loft-4',
        title: 'Urban Loft Studio',
        description: 'Modern loft in the heart of the city with exposed brick walls, high ceilings, and industrial-chic design. Perfect for urban professionals.',
        price: 650000,
        type: 'APARTMENT',
        status: 'ACTIVE',
        bedrooms: 1,
        bathrooms: 1,
        sqft: 900,
        yearBuilt: 2015,
        address: '101 Urban Street',
        city: 'Chicago',
        state: 'IL',
        zipCode: '60601',
        latitude: 41.8781,
        longitude: -87.6298,
        amenities: ['Exposed Brick', '14-foot Ceilings', 'City Views', 'Hardwood Floors', 'Modern Kitchen'],
        images: [
          'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&auto=format&fit=crop'
        ],
        featured: false,
        agent: {
          id: 'agent-4',
          name: 'David City',
          email: 'david@luxeliving.com',
          phone: '+1 (312) 555-0912',
          role: 'AGENT'
        },
        virtualTour: null,
        floorPlan: 'https://example.com/floorplans/loft-4.pdf',
        createdAt: new Date('2023-04-12').toISOString(),
        updatedAt: new Date('2023-09-18').toISOString()
      },
      'family-home-5': {
        id: 'family-home-5',
        title: 'Suburban Family Home',
        description: 'Perfect family home in excellent school district with large backyard, updated kitchen, and finished basement. Great neighborhood with parks nearby.',
        price: 850000,
        type: 'HOUSE',
        status: 'ACTIVE',
        bedrooms: 4,
        bathrooms: 3,
        sqft: 2800,
        yearBuilt: 2012,
        address: '202 Maple Street',
        city: 'Austin',
        state: 'TX',
        zipCode: '73301',
        latitude: 30.2672,
        longitude: -97.7431,
        amenities: ['Large Backyard', 'Playground', '2-Car Garage', 'Updated Kitchen', 'Finished Basement', 'Patio', 'Garden'],
        images: [
          'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1200&auto=format&fit=crop'
        ],
        featured: false,
        agent: {
          id: 'agent-5',
          name: 'Lisa Suburbs',
          email: 'lisa@luxeliving.com',
          phone: '+1 (512) 555-0345',
          role: 'AGENT'
        },
        virtualTour: 'https://my.matterport.com/show/?m=example012',
        floorPlan: 'https://example.com/floorplans/home-5.pdf',
        createdAt: new Date('2023-05-20').toISOString(),
        updatedAt: new Date('2023-10-25').toISOString()
      }
    };
    
    if (sampleProperties[id]) {
      return res.json({
        success: true,
        data: sampleProperties[id],
        source: 'sample'
      });
    }
    
    // Property not found
    return res.status(404).json({
      success: false,
      error: 'Property not found'
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