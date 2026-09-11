import { PrismaClient } from "./generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

// Re-export every generated model type, enum and the `Prisma` namespace so that
// consumers only ever depend on `@manzil/db`, never on the generated path.
export * from "./generated/prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Load your environment before importing @manzil/db."
    )
  }
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

// Reuse the client across Next.js HMR reloads and tsx watch restarts so that we
// do not exhaust the Postgres connection pool in development.
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
