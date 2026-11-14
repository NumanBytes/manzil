"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AuthHeader } from "@/components/layout/public-header"
import { Card, PageHeading } from "@/components/shared/primitives"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { signup } from "@/actions/auth"

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const result = await signup({ name, email, password, confirmPassword })

    if (!result.success) {
      setError(result.error)
      setLoading(false)
      return
    }

    const signInResult = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })

    if (signInResult?.error) {
      setError("Account created, but sign-in failed. Please try logging in.")
      setLoading(false)
      return
    }

    router.push("/onboarding")
  }

  async function handleGoogleSignIn() {
    await signIn("google", { callbackUrl: "/dashboard" })
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <AuthHeader />
      <main className="mx-auto box-border flex w-full max-w-[440px] flex-1 flex-col gap-5 px-4 pt-6 pb-18 md:px-6 md:pt-10">
        <div className="flex flex-col gap-1.5">
          <PageHeading>Create your account.</PageHeading>
          <p className="m-0 text-muted-foreground">Then you&apos;ll name your destination. Two minutes, no card.</p>
        </div>

        <Card as="form" onSubmit={handleSubmit} className="gap-4 p-[18px] md:p-7">
          <Button type="button" variant="outline" size="lg" className="w-full" onClick={handleGoogleSignIn}>
            Continue with Google
          </Button>

          <div className="flex items-center gap-3 text-[13px] text-muted-foreground">
            <span className="flex-1 border-t border-border" />
            or with email
            <span className="flex-1 border-t border-border" />
          </div>

          {error && (
            <div role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="name">Your name</Label>
            <Input
              id="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <span className="text-[13px] text-muted-foreground">At least 8 characters. A sentence works well.</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? "Creating account..." : "Create account"}
          </Button>
        </Card>

        <p className="m-0 text-center text-sm text-muted-foreground">
          Already have one?{" "}
          <Link href="/login" className="font-semibold text-link underline hover:text-foreground">
            Sign in
          </Link>
        </p>
      </main>
    </div>
  )
}
