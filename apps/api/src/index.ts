// Must be first: importing env.ts applies the .env files and validates the
// whole environment, reporting every problem at once. @manzil/db reads
// DATABASE_URL as it loads, so it may not be imported before this.
import { env } from "./env"

import { prisma } from "@manzil/db"
import { createApp } from "./app"
import { logger } from "./lib/logger"

const app = createApp()

const server = app.listen(env.PORT, () => {
  logger.info(`API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`)
})

/**
 * Stop accepting connections, let in-flight requests finish, then release the
 * database pool — otherwise Railway's deploys drop live requests.
 */
async function shutdown(signal: string) {
  logger.info(`${signal} received, shutting down`)

  server.close(async (err) => {
    if (err) {
      logger.error({ err }, "Error while closing HTTP server")
      process.exit(1)
    }
    await prisma.$disconnect()
    process.exit(0)
  })

  // Do not hang forever on a stuck connection.
  setTimeout(() => {
    logger.error("Forced shutdown after timeout")
    process.exit(1)
  }, 10_000).unref()
}

process.on("SIGTERM", () => void shutdown("SIGTERM"))
process.on("SIGINT", () => void shutdown("SIGINT"))
