import type { Request } from "express"
import type { AuthUser } from "./auth-token"
import { UnauthorizedError } from "./errors"

/**
 * Narrows `req.user` to a value. `requireAuth` guarantees it is set, but this
 * keeps that guarantee in the type system instead of a non-null assertion in
 * every handler — and fails loudly if a route ever forgets the middleware.
 */
export function currentUser(req: Request): AuthUser {
  if (!req.user) throw new UnauthorizedError()
  return req.user
}
