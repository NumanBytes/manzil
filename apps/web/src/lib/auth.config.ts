import type { NextAuthConfig, Session, User } from "next-auth"
import type { JWT } from "next-auth/jwt"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import {
  SESSION_MAX_AGE,
  decodeSessionToken,
  encodeSessionToken,
} from "./auth.jwt"

/**
 * Copies identity onto the token at sign-in, and lets the onboarding page flip
 * `onboarded` without forcing a fresh login. Exported so auth.ts can reuse it
 * after its Google upsert rather than duplicating the logic.
 */
export async function applyUserToToken({ token, user, trigger, session }: {
  token: JWT
  user?: User
  trigger?: "signIn" | "signUp" | "update"
  session?: { onboarded?: boolean }
}): Promise<JWT> {
  if (user) {
    if (user.id) token.sub = user.id
    if ("onboarded" in user) {
      token.onboarded = user.onboarded as boolean | undefined
    }
  }
  if (trigger === "update" && session?.onboarded !== undefined) {
    token.onboarded = session.onboarded
  }
  return token
}

/**
 * The Edge-safe half of the auth setup. The proxy imports this to decide access
 * without pulling in anything Node-only, so it must not touch the API client.
 * apps/web/src/lib/auth.ts extends it with the parts that need Node.
 */
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
    newUser: "/onboarding",
  },

  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE,
  },

  // Signed rather than encrypted, so the Express API can verify the same token.
  jwt: {
    encode: encodeSessionToken,
    decode: decodeSessionToken,
  },

  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    // A placeholder so the Edge instance knows the provider exists. The real
    // credential check lives in auth.ts and calls the API.
    Credentials({
      async authorize() {
        return null
      },
    }),
  ],

  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnboarding = nextUrl.pathname.startsWith("/onboarding")
      const isAuthRoute = nextUrl.pathname.startsWith("/login") ||
        nextUrl.pathname.startsWith("/signup")
      const isPublicRoute = nextUrl.pathname.startsWith("/api/auth") ||
        nextUrl.pathname === "/"

      if (isPublicRoute) return true
      if (isLoggedIn && isAuthRoute) return Response.redirect(new URL("/dashboard", nextUrl))
      if (!isLoggedIn && !isAuthRoute) return false
      if (isLoggedIn && !auth?.user?.onboarded && !isOnboarding) {
        return Response.redirect(new URL("/onboarding", nextUrl))
      }
      return true
    },

    async session({ session, token }: { session: Session; token: JWT }) {
      if (token.sub) {
        session.user.id = token.sub
      }
      if (token.onboarded !== undefined) {
        session.user.onboarded = token.onboarded as boolean
      }
      return session
    },

    jwt: applyUserToToken,
  },
}
