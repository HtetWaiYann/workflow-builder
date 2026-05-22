import { PrismaClient } from '../generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
  return new PrismaClient({ adapter })
}

export const prisma = createPrismaClient()

export async function checkDbConnection(): Promise<void> {
  await prisma.$queryRaw`SELECT 1`
}
