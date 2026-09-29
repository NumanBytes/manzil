import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { SidebarNav } from "@/components/layout/sidebar-nav"
import { SignOutButton } from "@/components/layout/sign-out-button"

/**
 * The signed-in shell. proxy.ts already turns anonymous visitors away before a
 * page renders, but this checks again: the proxy guards navigation, and a layout
 * should not assume a session exists just because the usual entry path provides
 * one. It also needs the session anyway, to show who is signed in.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  return (
    <div className="flex flex-1">
      <aside className="flex w-56 shrink-0 flex-col justify-between border-r border-border bg-sidebar p-4">
        <div className="space-y-6">
          <div className="px-2.5">
            <span className="text-lg font-semibold tracking-tight text-foreground">
              Manzil
            </span>
          </div>
          <SidebarNav />
        </div>

        <div className="space-y-2 border-t border-border pt-4">
          <div className="px-2.5">
            <p className="truncate text-sm font-medium text-foreground">
              {session.user.name}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {session.user.email}
            </p>
          </div>
          <SignOutButton />
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  )
}
