import { resolve } from "node:path"
import { config } from "dotenv"
import { defineConfig } from "prisma/config"

// One .env at the repo root is the source of truth for local development, so
// the Prisma CLI reads it from here rather than expecting a copy per package.
config({ path: resolve(process.cwd(), "../../.env") })

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
})
