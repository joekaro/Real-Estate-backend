import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Sample property data
const sampleProperties = {
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
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&auto=format&fit=crop'
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
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&auto=format&fit=crop'
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
      'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200&auto=format&fit=crop'
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

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'LuxeLiving API is running',
    environment: process.env.NODE_ENV || 'development',
    platform: process.env.RENDER ? 'Render' : 'Local'
  });
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
app.get('/api/properties/featured', (req, res) => {
  const featuredProperties = [
    sampleProperties['luxury-villa-1'],
    sampleProperties['downtown-penthouse-2'],
    sampleProperties['mountain-cabin-3']
  ];
  
  res.json({
    success: true,
    count: featuredProperties.length,
    data: featuredProperties,
    source: 'sample'
  });
});

// Get all properties
app.get('/api/properties', (req, res) => {
  const allProperties = Object.values(sampleProperties);
  
  res.json({
    success: true,
    count: allProperties.length,
    total: allProperties.length,
    page: 1,
    pages: 1,
    data: allProperties,
    source: 'sample'
  });
});

// Get single property - SIMPLE WORKING VERSION
app.get('/api/properties/:id', (req, res) => {
  const { id } = req.params;
  
  console.log(`Looking for property with ID: ${id}`);
  
  if (sampleProperties[id]) {
    return res.json({
      success: true,
      data: sampleProperties[id],
      source: 'sample'
    });
  }
  
  // Property not found
  console.log(`Property not found: ${id}`);
  res.status(404).json({
    success: false,
    error: `Property not found: ${id}`,
    available_ids: Object.keys(sampleProperties)
  });
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
app.post('/api/auth/register', (req, res) => {
  try {
    const { email, password, name, phone, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

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
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Registration failed'
    });
  }
});

// Login endpoint
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

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
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
});

// Debug endpoint
app.get('/api/debug/properties', (req, res) => {
  res.json({
    available_properties: Object.keys(sampleProperties),
    sample_call: 'https://luxeliving-backend.onrender.com/api/properties/luxury-villa-1'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🔐 Auth routes: http://localhost:${PORT}/api/auth`);
  console.log(`🏠 Properties: http://localhost:${PORT}/api/properties`);
  console.log(`💾 Using sample data (no database)`);
});