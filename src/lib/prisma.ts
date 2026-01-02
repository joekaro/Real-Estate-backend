import { PrismaClient } from '@prisma/client'

// Render-specific fix
let databaseUrl = process.env.DATABASE_URL

if (process.env.NODE_ENV === 'production' && process.env.RENDER) {
  // On Render, use in-memory SQLite
  databaseUrl = 'file:./dev.db?mode=memory&cache=shared'
  console.log('🔧 Using in-memory SQLite for Render')
}

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