import Link from "next/link"
import type { CurrentUser, Paginated, PathDto } from "@manzil/shared"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"

// Every render hits the API as the signed-in user, so there is nothing to
// prerender at build time.
export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  // Two independent reads, so fire them together rather than awaiting in
  // sequence — the API round trips are the slow part here.
  const [user, paths] = await Promise.all([
    api.get<CurrentUser>("/users/me"),
    api.get<Paginated<PathDto>>("/paths"),
  ])

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {user.name ? `Welcome back, ${user.name.split(" ")[0]}` : "Welcome back"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <Stat label="Learning paths" value={String(paths.items.length)} />
        <Stat label="Daily target" value={user.dailyHours ? `${user.dailyHours}h` : "—"} />
        <Stat label="Experience" value={user.yearsOfExp !== null ? `${user.yearsOfExp}y` : "—"} />
      </section>

      {user.goal && (
        <section className="rounded-lg border border-border bg-card p-4">
          <h2 className="text-sm font-medium text-muted-foreground">Your goal</h2>
          <p className="mt-1 text-foreground">{user.goal}</p>
        </section>
      )}

      {user.techStack.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground">Your stack</h2>
          <div className="flex flex-wrap gap-2">
            {user.techStack.map((tech) => (
              <span
                key={tech}
                className="rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground"
              >
                {tech}
              </span>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground">Recent paths</h2>
          <Button variant="link" size="sm" render={<Link href="/paths" />}>
            View all
          </Button>
        </div>

        {paths.items.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No paths yet.{" "}
            <Link href="/paths/new" className="text-primary hover:underline">
              Create your first one
            </Link>
            .
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {paths.items.slice(0, 3).map((path) => (
              <li key={path.id} className="px-4 py-3">
                <Link href="/paths" className="font-medium text-foreground hover:underline">
                  {path.title}
                </Link>
                <p className="text-sm text-muted-foreground">{path.goal}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">{value}</p>
    </div>
  )
}
