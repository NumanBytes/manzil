import type { AuthUser } from "../lib/auth-token"

declare global {
  namespace Express {
    interface Request {
      /** Populated by `requireAuth`; absent on public routes. */
      user?: AuthUser
    }
  }
}

export {}
