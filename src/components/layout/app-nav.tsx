"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Logo } from "@/components/shared/logo"
import { AccountMenu } from "./account-menu"
import { cn } from "@/lib/utils"

const TABS = [
  { href: "/dashboard", label: "Today" },
  { href: "/paths", label: "Journey" },
  { href: "/practice", label: "Practice" },
  { href: "/library", label: "Read" },
  { href: "/progress", label: "Progress" },
] as const

export function AppNav({ name, goal }: { name: string; goal?: string | null }) {
  const pathname = usePathname()

  return (
    <header className="relative z-10 flex flex-wrap items-center gap-x-7 gap-y-2 border-b border-border bg-card px-4 py-3 md:px-8">
      <Logo href="/dashboard" />
      <nav aria-label="Main" className="order-last flex w-full flex-wrap gap-1 md:order-none md:w-auto">
        {TABS.map((tab) => {
          const active = pathname === tab.href || pathname.startsWith(tab.href + "/")
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "inline-flex min-h-11 items-center rounded-lg px-3 text-[15px] font-semibold no-underline md:px-4",
                active
                  ? "bg-nav-active text-nav-active-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </Link>
          )
        })}
      </nav>
      <div className="ml-auto">
        <AccountMenu name={name} goal={goal} />
      </div>
    </header>
  )
}
