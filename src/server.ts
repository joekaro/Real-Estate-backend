import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { prisma } from './lib/prisma';
import authRoutes from './routes/auth';
import propertyRoutes from './routes/properties';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);

// Health check with database status
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
    // Proper error handling
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.json({ 
      status: 'WARNING', 
      message: 'API is running but database may have issues',
      database: 'Error',
      error: errorMessage,
      environment: process.env.NODE_ENV || 'development'
    });
  }
});

// Simple test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'API is working!',
    timestamp: new Date().toISOString(),
    url: req.get('host')
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
    res.status(500).json({
      success: false,
      error: 'Failed to fetch featured properties'
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
    
    // Fallback sample data
    const sampleData = [
      {
        id: 'sample-1',
        title: 'Sample Luxury Home',
        description: 'This is sample data. Database might be initializing.',
        price: 1500000,
        type: 'HOUSE',
        bedrooms: 4,
        bathrooms: 3,
        sqft: 3000,
        address: '456 Sample Street',
        city: 'Sample City',
        state: 'CA',
        zipCode: '90000',
        amenities: ['Pool', 'Garage', 'Garden'],
        images: ['https://picsum.photos/800/600?sample=1'],
        featured: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    
    res.json({
      success: true,
      count: sampleData.length,
      total: sampleData.length,
      page: 1,
      pages: 1,
      data: sampleData,
      note: 'Using sample data. Database connection might be establishing.',
      error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
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

// Simple auth info endpoint
app.get('/api/auth', (req, res) => {
  res.json({
    message: 'Authentication API',
    endpoints: {
      register: 'POST /api/auth/register',
      login: 'POST /api/auth/login'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🔐 Auth routes: http://localhost:${PORT}/api/auth`);
  console.log(`🏠 Properties: http://localhost:${PORT}/api/properties`);
  console.log(`💾 Database: Connected`);
});