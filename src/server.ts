import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { prisma } from './lib/prisma';
import authRoutes from './routes/auth';
import propertyRoutes from './routes/properties';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize database on startup
async function initializeDatabase() {
  try {
    console.log('📦 Initializing database...');
    
    // Force connection to create in-memory database
    await prisma.$connect();
    
    // Create tables if they don't exist
    await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS "users" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "email" TEXT NOT NULL,
      "password" TEXT NOT NULL,
      "name" TEXT,
      "phone" TEXT,
      "role" TEXT NOT NULL DEFAULT 'BUYER',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL
    )`;
    
    await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS "properties" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "title" TEXT NOT NULL,
      "description" TEXT NOT NULL,
      "price" INTEGER NOT NULL,
      "type" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'ACTIVE',
      "bedrooms" INTEGER NOT NULL,
      "bathrooms" INTEGER NOT NULL,
      "sqft" INTEGER NOT NULL,
      "yearBuilt" INTEGER,
      "address" TEXT NOT NULL,
      "city" TEXT NOT NULL,
      "state" TEXT NOT NULL,
      "zipCode" TEXT NOT NULL,
      "latitude" REAL,
      "longitude" REAL,
      "amenities" TEXT NOT NULL DEFAULT '[]',
      "images" TEXT NOT NULL DEFAULT '[]',
      "virtualTour" TEXT,
      "floorPlan" TEXT,
      "featured" BOOLEAN NOT NULL DEFAULT false,
      "agentId" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL,
      FOREIGN KEY ("agentId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
    )`;
    
    // Seed with sample data if empty
    const propertyCount = await prisma.property.count();
    if (propertyCount === 0) {
      console.log('🌱 Seeding database with sample data...');
      
      // Create sample data
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
          amenities: JSON.stringify(['Pool', 'Beach Access', 'Gym', 'Smart Home']),
          images: JSON.stringify([
            'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop'
          ]),
          featured: true
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
          amenities: JSON.stringify(['Rooftop', 'Concierge', 'Gym', 'Parking']),
          images: JSON.stringify([
            'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop'
          ]),
          featured: true
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
          amenities: JSON.stringify(['Fireplace', 'Hot Tub', 'Hiking Trails', 'Garage']),
          images: JSON.stringify([
            'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1476820865390-c52aeebb9891?w=800&auto=format&fit=crop'
          ]),
          featured: true
        }
      ];
      
      await prisma.property.createMany({ data: sampleProperties });
      console.log(`✅ Seeded ${sampleProperties.length} properties`);
    }
    
    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
  }
}

// Initialize database before starting server
initializeDatabase();

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

// Health check
app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ 
      status: 'OK', 
      message: 'LuxeLiving API is running',
      database: 'Connected',
      environment: process.env.NODE_ENV || 'development'
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

// Rest of your routes remain the same...
// [Keep all your existing routes for properties, auth, etc.]

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🔐 Auth routes: http://localhost:${PORT}/api/auth`);
  console.log(`🏠 Properties: http://localhost:${PORT}/api/properties`);
});