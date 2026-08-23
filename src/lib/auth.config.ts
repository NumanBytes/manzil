import type { NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
    newUser: "/onboarding",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
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
  },
}
