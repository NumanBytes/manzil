import { jwtVerify } from "jose"
import { env } from "../env"

export type AuthUser = {
  id: string
  email: string
  name: string
  onboarded: boolean
}

/**
 * Claims the web app puts into the session token. They must stay in step with
 * the `jwt.encode` override in apps/web/src/lib/auth.ts.
 */
export const TOKEN_ISSUER = "manzil-web"
export const TOKEN_AUDIENCE = "manzil-api"

const secret = new TextEncoder().encode(env.AUTH_SECRET)

/**
 * Verifies a session token minted by NextAuth in the web app. Returns null for
 * any token that is malformed, expired, or not signed by our shared secret —
 * the caller decides whether that is a 401 or simply an anonymous request.
 */
export async function verifySessionToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
      issuer: TOKEN_ISSUER,
      audience: TOKEN_AUDIENCE,
    })

    const { sub, email, name, onboarded } = payload as Record<string, unknown>

    if (typeof sub !== "string" || typeof email !== "string") return null

    return {
      id: sub,
      email,
      name: typeof name === "string" ? name : "",
      onboarded: onboarded === true,
    }
  } catch {
    return null
  }
}
