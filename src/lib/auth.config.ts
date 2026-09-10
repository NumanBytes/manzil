import type { NextAuthConfig, Session, User } from "next-auth"
import type { JWT } from "next-auth/jwt"
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
    async session({ session, token }: { session: Session; token: JWT }) {
      if (token.sub) {
        session.user.id = token.sub
      }
      if (token.onboarded != undefined) {
        session.user.onboarded = token.onboarded as boolean
      }
      return session
    },
    async jwt({ token, user, trigger, session }: {
      token: JWT
      user?: User
      trigger?: "signIn" | "signUp" | "update"
      session?: { onboarded?: boolean }
    }) {
      if (user && "onboarded" in user) {
        token.onboarded = user.onboarded as boolean | undefined
      }
      if (trigger === "update" && session?.onboarded !== undefined) {
        token.onboarded = session.onboarded
      }
      return token
    },
  },
}
