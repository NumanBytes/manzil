import Link from "next/link"
import { Logo } from "@/components/shared/logo"
import { buttonVariants } from "@/components/ui/button"

export function PublicHeader() {
  return (
    <header className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-border bg-card px-4 py-3 md:px-8">
      <Logo />
      <nav aria-label="Site" className="flex flex-wrap gap-1">
        <a href="#how" className="inline-flex min-h-11 items-center rounded-lg px-3.5 text-[15px] font-semibold text-muted-foreground no-underline hover:text-foreground">
          How it works
        </a>
        <a href="#honest" className="inline-flex min-h-11 items-center rounded-lg px-3.5 text-[15px] font-semibold text-muted-foreground no-underline hover:text-foreground">
          Why it&apos;s honest
        </a>
      </nav>
      <div className="ml-auto flex gap-2">
        <Link href="/login" className={buttonVariants({ variant: "outline" })}>
          Sign in
        </Link>
        <Link href="/signup" className={buttonVariants()}>
          Create your manzil
        </Link>
      </div>
    </header>
  )
}

/** Bare logo header used on sign-in and sign-up. */
export function AuthHeader() {
  return (
    <header className="flex items-center px-4 py-3 md:px-8">
      <Logo />
    </header>
  )
}
