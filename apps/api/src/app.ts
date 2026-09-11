import express from "express"
import cors from "cors"
import helmet from "helmet"
import { pinoHttp } from "pino-http"
import { allowedOrigins } from "./env"
import { logger } from "./lib/logger"
import { apiRouter } from "./routes"
import { errorHandler, notFoundHandler } from "./middleware/error-handler"

export function createApp() {
  const app = express()

  // Behind Railway's proxy, trust the first hop so rate limiting and logging
  // see the real client IP instead of the load balancer's.
  app.set("trust proxy", 1)

  app.use(helmet())
  app.use(
    cors({
      origin: allowedOrigins,
      credentials: true,
      // The web app forwards the session as a bearer token and authenticates
      // internal calls with a shared secret header.
      allowedHeaders: ["Content-Type", "Authorization", "X-Internal-Secret"],
    })
  )
  app.use(express.json({ limit: "1mb" }))
  app.use(pinoHttp({ logger }))

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", uptime: process.uptime() })
  })

  app.use("/api/v1", apiRouter)

  // Order matters: unmatched routes become a 404 error, and the error handler
  // must be registered last of all.
  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
