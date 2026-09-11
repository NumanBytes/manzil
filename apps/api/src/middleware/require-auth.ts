import type { RequestHandler } from "express"
import { timingSafeEqual } from "node:crypto"
import { env } from "../env"
import { UnauthorizedError } from "../lib/errors"
import { verifySessionToken } from "../lib/auth-token"

function bearerToken(header: string | undefined): string | null {
  if (!header) return null
  const [scheme, token] = header.split(" ")
  if (scheme?.toLowerCase() !== "bearer" || !token) return null
  return token
}

/**
 * Rejects the request unless it carries a valid session token, and hangs the
 * caller's identity off `req.user` for everything downstream.
 */
export const requireAuth: RequestHandler = async (req, _res, next) => {
  const token = bearerToken(req.headers.authorization)
  if (!token) return next(new UnauthorizedError())

  const user = await verifySessionToken(token)
  if (!user) return next(new UnauthorizedError("Invalid or expired session"))

  req.user = user
  next()
}

/**
 * Routes the web app's NextAuth backend calls before any session exists — the
 * credentials check and the OAuth upsert. They are server-to-server only, so
 * they are gated on a shared secret instead of a user session.
 */
export const requireServiceToken: RequestHandler = (req, _res, next) => {
  const provided = req.headers["x-internal-secret"]
  if (typeof provided !== "string") return next(new UnauthorizedError())

  const expected = Buffer.from(env.INTERNAL_API_SECRET)
  const actual = Buffer.from(provided)

  // Compare in constant time; lengths must match first because timingSafeEqual
  // throws on differing lengths.
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return next(new UnauthorizedError())
  }

  next()
}
