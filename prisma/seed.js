const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create users
  const agent = await prisma.user.create({
    data: {
      email: 'sarah.johnson@luxeliving.com',
      password: await bcrypt.hash('password123', 10),
      name: 'Sarah Johnson',
      phone: '(555) 123-4567',
      role: 'AGENT',
    },
  });

  const buyer = await prisma.user.create({
    data: {
      email: 'john.doe@example.com',
      password: await bcrypt.hash('password123', 10),
      name: 'John Doe',
      phone: '(555) 987-6543',
      role: 'BUYER',
    },
  });

  console.log('✅ Created users');

  // Create properties
  const properties = [
    {
      title: 'Modern Villa with Ocean View',
      description: 'Luxurious 5-bedroom villa with panoramic ocean views, infinity pool, and smart home features. Located in exclusive Malibu neighborhood.',
      price: 1250000,
      type: 'VILLA',
      bedrooms: 5,
      bathrooms: 4,
      sqft: 3200,
      yearBuilt: 2020,
      address: '123 Ocean Drive',
      city: 'Malibu',
      state: 'CA',
      zipCode: '90265',
      latitude: 34.0259,
      longitude: -118.7798,
      amenities: JSON.stringify(['pool', 'gym', 'garage', 'garden', 'smart-home', 'security-system']),
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200&auto=format&fit=crop'
      ]),
      virtualTour: 'https://matterport.com/tour123',
      floorPlan: '/floorplans/villa-123.pdf',
      featured: true,
      agentId: agent.id,
    },
    {
      title: 'Downtown Luxury Apartment',
      description: 'Modern apartment in the heart of downtown with concierge service, rooftop terrace, and premium finishes. Walking distance to restaurants and shops.',
      price: 850000,
      type: 'APARTMENT',
      bedrooms: 3,
      bathrooms: 2,
      sqft: 1800,
      yearBuilt: 2019,
      address: '456 Skyline Blvd',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94105',
      latitude: 37.7749,
      longitude: -122.4194,
      amenities: JSON.stringify(['concierge', 'rooftop', 'gym', 'parking', 'elevator', 'pet-friendly']),
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1494526585095-c41746248156?w=1200&auto=format&fit=crop'
      ]),
      featured: true,
      agentId: agent.id,
    },
    {
      title: 'Suburban Family Home',
      description: 'Spacious family home in quiet neighborhood with large backyard, updated kitchen, and excellent schools nearby. Perfect for growing families.',
      price: 625000,
      type: 'HOUSE',
      bedrooms: 4,
      bathrooms: 3,
      sqft: 2400,
      yearBuilt: 2015,
      address: '789 Maple Street',
      city: 'Austin',
      state: 'TX',
      zipCode: '73301',
      latitude: 30.2672,
      longitude: -97.7431,
      amenities: JSON.stringify(['backyard', 'fireplace', 'garage', 'patio', 'deck', 'garden']),
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&auto=format&fit=crop'
      ]),
      featured: false,
      agentId: agent.id,
    },
    {
      title: 'Mountain View Cabin',
      description: 'Cozy cabin with stunning mountain views, wood fireplace, and hiking trails. Perfect weekend getaway or vacation rental.',
      price: 450000,
      type: 'HOUSE',
      bedrooms: 3,
      bathrooms: 2,
      sqft: 1600,
      yearBuilt: 2010,
      address: '101 Pine Road',
      city: 'Aspen',
      state: 'CO',
      zipCode: '81611',
      latitude: 39.1911,
      longitude: -106.8175,
      amenities: JSON.stringify(['fireplace', 'mountain-view', 'hiking-trails', 'deck', 'wood-stove']),
      images: JSON.stringify([
        'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1476820865390-c52aeebb9891?w=1200&auto=format&fit=crop'
      ]),
      featured: true,
      agentId: agent.id,
    },
  ];

  for (const propertyData of properties) {
    await prisma.property.create({
      data: propertyData,
    });
  }

  console.log('✅ Created properties');

  // Create saved property for buyer
  const firstProperty = await prisma.property.findFirst();
  if (firstProperty) {
    await prisma.savedProperty.create({
      data: {
        userId: buyer.id,
        propertyId: firstProperty.id,
        notes: 'Interested in touring this property',
      },
    });
    console.log('✅ Created saved property');
  }

  console.log('🌱 Database seeding completed!');
  console.log(`👤 Agent login: sarah.johnson@luxeliving.com / password123`);
  console.log(`👤 Buyer login: john.doe@example.com / password123`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });