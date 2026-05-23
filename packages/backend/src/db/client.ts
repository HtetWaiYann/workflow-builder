import { PrismaClient } from '../generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

/**
 * Creates a PrismaClient backed by the pg adapter.
 * Reads `DATABASE_URL` from the environment; throws if it is unset.
 */
function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set')
  }
  const adapter = new PrismaPg({ connectionString: databaseUrl })
  return new PrismaClient({ adapter })
}

export const prisma = createPrismaClient()

/** Opens a database connection to verify the server is reachable. */
export async function checkDbConnection(): Promise<void> {
  await prisma.$connect()
}
