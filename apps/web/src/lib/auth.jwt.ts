import { SignJWT, jwtVerify } from "jose"
import type { JWT, JWTDecodeParams, JWTEncodeParams } from "next-auth/jwt"

/**
 * By default Auth.js encrypts the session token (JWE), which only Auth.js can
 * open. The Express API has to read the same token, so we sign it instead with
 * plain HS256 — a shape any service holding AUTH_SECRET can verify.
 *
 * The claims below must stay in step with apps/api/src/lib/auth-token.ts.
 *
 * This module runs in the Edge proxy as well as in Node, so it may only use
 * Web Crypto APIs. `jose` satisfies that.
 */
export const TOKEN_ISSUER = "manzil-web"
export const TOKEN_AUDIENCE = "manzil-api"
export const SESSION_MAX_AGE = 30 * 24 * 60 * 60 // 30 days, in seconds

function toKey(secret: JWTEncodeParams["secret"]): Uint8Array {
  // Auth.js may hand over a rotation array; the first entry is the current one.
  const value = Array.isArray(secret) ? secret[0] : secret
  if (!value) throw new Error("AUTH_SECRET is not set")
  return new TextEncoder().encode(value)
}

export async function encodeSessionToken({
  token,
  secret,
  maxAge = SESSION_MAX_AGE,
}: JWTEncodeParams): Promise<string> {
  if (!token) throw new Error("Cannot encode an empty session token")

  const issuedAt = Math.floor(Date.now() / 1000)

  return new SignJWT({ ...token })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(String(token.sub ?? ""))
    .setIssuer(TOKEN_ISSUER)
    .setAudience(TOKEN_AUDIENCE)
    .setIssuedAt(issuedAt)
    .setExpirationTime(issuedAt + maxAge)
    .sign(toKey(secret))
}

export async function decodeSessionToken({
  token,
  secret,
}: JWTDecodeParams): Promise<JWT | null> {
  if (!token) return null

  try {
    const { payload } = await jwtVerify(token, toKey(secret), {
      algorithms: ["HS256"],
      issuer: TOKEN_ISSUER,
      audience: TOKEN_AUDIENCE,
    })
    return payload as JWT
  } catch {
    // A tampered, expired or foreign token is simply "not signed in".
    return null
  }
}
