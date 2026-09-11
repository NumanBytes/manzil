import NextAuth from "next-auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { authConfig } from "./lib/auth.config"
import type { Session } from "next-auth"

interface AuthRequest extends NextRequest {
  auth: Session | null
}

export const proxy = NextAuth(authConfig).auth((req: AuthRequest) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth

  const isAuthRoute = nextUrl.pathname.startsWith("/login") ||
    nextUrl.pathname.startsWith("/signup")

  const isPublicRoute = nextUrl.pathname.startsWith("/api/auth") ||
    nextUrl.pathname === "/"

  const isOnboarding = nextUrl.pathname.startsWith("/onboarding")

  if (isPublicRoute) return NextResponse.next()

  if (isLoggedIn && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl))
  }

  if (!isLoggedIn && !isAuthRoute) {
    return NextResponse.redirect(new URL("/login", nextUrl))
  }

  if (isLoggedIn && !req.auth?.user?.onboarded && !isOnboarding) {
    return NextResponse.redirect(new URL("/onboarding", nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
