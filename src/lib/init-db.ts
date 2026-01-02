import { prisma } from './prisma'
import bcrypt from 'bcryptjs'

export async function initializeDatabase() {
  try {
    console.log('📦 Initializing database...')
    
    await prisma.$connect()
    console.log('✅ Database connected')
    
    const userCount = await prisma.user.count()
    
    if (userCount === 0) {
      console.log('🌱 Seeding database...')
      
      const adminPassword = await bcrypt.hash('admin123', 10)
      const admin = await prisma.user.create({
        data: {
          email: 'admin@luxeliving.com',
          password: adminPassword,
          name: 'Admin User',
          role: 'ADMIN'
        }
      })
      
      await prisma.property.createMany({
        data: [
          {
            title: 'Luxury Villa - Render Demo',
            description: 'Beautiful villa deployed on Render',
            price: 2500000,
            type: 'VILLA',
            bedrooms: 5,
            bathrooms: 4,
            sqft: 4500,
            address: '123 Render Street',
            city: 'San Francisco',
            state: 'CA',
            zipCode: '94101',
            amenities: JSON.stringify(['Pool', 'Gym', 'Garden']),
            images: JSON.stringify(['https://picsum.photos/800/600?property=1']),
            featured: true,
            agentId: admin.id
          }
        ]
      })
      
      console.log('✅ Database seeded with sample data')
    } else {
      console.log(`✅ Database has ${userCount} users`)
    }
    
  } catch (error) {
    // Proper error handling
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ Database initialization failed:', errorMessage)
  }
}