import Link from "next/link"
import type { Paginated, PathDto } from "@manzil/shared"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { DeletePathButton } from "@/components/paths/delete-path-button"

export const dynamic = "force-dynamic"

const MASTERY_LABELS: Record<PathDto["masteryLevel"], string> = {
  JOB_READY: "Job ready",
  SKILL_MASTERY: "Skill mastery",
  SENIOR_LEVEL: "Senior level",
}

// A fixed locale keeps server and client output identical. `toLocaleDateString()`
// with no arguments uses the ambient locale, which can differ between the two
// and produce a hydration mismatch.
const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
})

export default async function PathsPage() {
  const paths = await api.get<Paginated<PathDto>>("/paths")

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Learning paths
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {paths.items.length === 0
              ? "Nothing here yet."
              : `${paths.items.length} path${paths.items.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <Button render={<Link href="/paths/new" />}>New path</Button>
      </header>

      {paths.items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Create a path to describe something you want to learn, and by when.
        </p>
      ) : (
        <ul className="space-y-3">
          {paths.items.map((path) => (
            <li
              key={path.id}
              className="rounded-lg border border-border bg-card p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 space-y-1">
                  <h2 className="font-medium text-foreground">{path.title}</h2>
                  <p className="text-sm text-muted-foreground">{path.goal}</p>
                  {path.description && (
                    <p className="text-sm text-muted-foreground">{path.description}</p>
                  )}
                </div>
                <DeletePathButton id={path.id} title={path.title} />
              </div>

              <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
                <div className="flex gap-1">
                  <dt>Target</dt>
                  <dd className="text-foreground">
                    {dateFormat.format(new Date(path.targetDate))}
                  </dd>
                </div>
                <div className="flex gap-1">
                  <dt>Pace</dt>
                  <dd className="text-foreground">{path.dailyHours}h / day</dd>
                </div>
                <div className="flex gap-1">
                  <dt>Level</dt>
                  <dd className="text-foreground">{MASTERY_LABELS[path.masteryLevel]}</dd>
                </div>
                {path.driftDays > 0 && (
                  <div className="flex gap-1">
                    <dt>Drift</dt>
                    <dd className="text-destructive">{path.driftDays}d behind</dd>
                  </div>
                )}
              </dl>
            </li>
          ))}
        </ul>
      )}

      {paths.nextCursor && (
        <p className="text-center text-xs text-muted-foreground">
          More paths available — pagination UI still to build.
        </p>
      )}
    </div>
  )
}
