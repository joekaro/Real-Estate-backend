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
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);

// Basic route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'LuxeLiving Realty API is running',
    timestamp: new Date().toISOString(),
    database: 'Connected'
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

    app.use(cors({
  origin: '*', // Allow all for now (we'll restrict later)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
    
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
    console.error('Error fetching featured properties:', error);
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
    console.error('Error fetching properties:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch properties'
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
    console.error('Error fetching property:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch property'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🔐 Auth routes: http://localhost:${PORT}/api/auth`);
  console.log(`💾 Database: Connected`);
});