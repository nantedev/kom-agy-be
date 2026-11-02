import { prisma } from '@/repositories/prisma.js'
import type { DbHealthRepository } from '@/services/dbHealthService.js'

export class PrismaDbHealthRepository implements DbHealthRepository {
  async ping(): Promise<void> {
    await prisma.$queryRaw`SELECT 1`
  }
}

export const dbHealthRepository = new PrismaDbHealthRepository()
