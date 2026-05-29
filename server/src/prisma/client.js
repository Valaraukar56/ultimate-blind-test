import { PrismaClient } from '@prisma/client'
import { env } from '../config/env.js'

// Singleton Prisma : évite d'ouvrir plusieurs connexions lors du hot reload.
const globalForPrisma = globalThis

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (env.nodeEnv !== 'production') {
  globalForPrisma.prisma = prisma
}
