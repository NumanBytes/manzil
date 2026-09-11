// First import, and the only place that pulls it in: everything below reads
// process.env, so the .env files must already be applied. Importing this as a
// dependency of env.ts (rather than as a sibling in index.ts) is what
// guarantees the ordering.
import "./load-env"

import { z } from "zod"

/**
 * Fail fast and loudly on boot rather than at the first request that happens to
 * need a missing variable.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  /**
   * Shared with the web app. NextAuth signs session tokens with this secret and
   * the API verifies them, which is what lets two services trust one session.
   */
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters"),

  /**
   * Guards the /auth/* endpoints that only the web app's NextAuth backend may
   * call. These run before a session exists, so they cannot use AUTH_SECRET.
   */
  INTERNAL_API_SECRET: z
    .string()
    .min(32, "INTERNAL_API_SECRET must be at least 32 characters"),

  /** Comma-separated list of browser origins allowed to call this API. */
  WEB_ORIGIN: z.string().default("http://localhost:3000"),

  ANTHROPIC_API_KEY: z.string().optional(),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
    .join("\n")
  throw new Error(`Invalid environment configuration:\n${issues}`)
}

export const env = parsed.data

export const allowedOrigins = env.WEB_ORIGIN.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean)

export const isProduction = env.NODE_ENV === "production"
