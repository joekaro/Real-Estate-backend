import { PrismaClient } from '@prisma/client'

// Force in-memory SQLite for Render
const databaseUrl = process.env.RENDER 
  ? 'file:./dev.db?mode=memory&cache=shared'
  : process.env.DATABASE_URL || 'file:./dev.db'

console.log(`🔧 Using database URL: ${databaseUrl}`)

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl
    }
  }
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma