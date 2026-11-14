import Link from "next/link"
import { requireUser } from "@/lib/session"
import { buttonVariants } from "@/components/ui/button"
import { Card, Eyebrow, PageHeading, PageMain } from "@/components/shared/primitives"
import { JourneyBoard } from "@/components/paths/journey-board"
import { PathProjects } from "@/components/paths/path-projects"
import { PathSwitcher } from "@/components/paths/path-switcher"
import { getJourney, currentStep } from "@/lib/data/journey"
import { formatDate } from "@/lib/dates"
import { pathStats } from "@/lib/pace"

export default async function JourneyPage({ searchParams }: { searchParams: Promise<{ path?: string }> }) {
  const user = await requireUser()
  const { path: requested } = await searchParams
  const { paths, path, projects } = await getJourney(user.id, requested)

  if (!path) {
    return (
      <PageMain>
        <div className="flex flex-col gap-1.5">
          <Eyebrow>Journey</Eyebrow>
          <PageHeading>You don&apos;t have a path yet.</PageHeading>
        </div>
        <Card className="items-start gap-3 p-[18px] md:p-7">
          <p className="m-0 max-w-[62ch] text-muted-foreground">
            Answer seven questions about the job you want, where you&apos;re starting from and how much time you really
            have. Manzil draws the path backwards from there, in steps small enough to start today.
          </p>
          <Link href="/paths/new" className={buttonVariants({ size: "lg" })}>
            Draw my path
          </Link>
        </Card>
      </PageMain>
    )
  }

  const stats = pathStats(path)
  const cur = currentStep(path)
  const fmt = (d: Date) => formatDate(d, { day: "numeric", month: "long", year: "numeric" })

  return (
    <PageMain className="md:gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1.5">
          <Eyebrow>
            {path.isMain ? "Your main path" : "Path"} · {stats.walkedPct}% walked ·{" "}
            {stats.finished ? "arrived" : `lands ${fmt(stats.landsOn)}`}
          </Eyebrow>
          <PageHeading>{path.title}</PageHeading>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <PathSwitcher paths={paths} currentId={path.id} />
          <Link href="/paths/new" className={buttonVariants()}>
            New path
          </Link>
        </div>
      </div>

      <JourneyBoard
        path={{
          id: path.id,
          goal: path.goal,
          weeklyHours: path.weeklyHours,
          milestones: path.milestones.map((m) => ({
            id: m.id,
            title: m.title,
            why: m.description,
            isCompleted: m.isCompleted,
            completedAt: m.completedAt ? formatDate(m.completedAt, { day: "numeric", month: "short" }) : null,
            steps: m.steps.map((s) => ({
              id: s.id,
              kind: s.kind,
              title: s.title,
              hours: s.estimatedHours ?? 1,
              isCompleted: s.isCompleted,
              doneLooksLike: s.doneLooksLike,
              resourceNote: s.resourceNote,
              subtasks: s.subtasks.map((u) => ({ id: u.id, title: u.title, minutes: u.minutes, done: u.isCompleted })),
            })),
          })),
        }}
        stats={{
          stops: stats.stops,
          trailPlan: stats.trailPlan,
          finished: stats.finished,
          currentMilestoneIndex: stats.currentMilestoneIndex,
          currentStepId: cur?.step.id ?? null,
          paceWeekly: stats.paceWeekly,
          paceIsActual: stats.actualWeekly !== null,
          neededWeekly: stats.neededWeekly,
          landsOn: fmt(stats.landsOn),
          target: fmt(path.targetDate),
          daysLate: stats.daysLate,
        }}
        aside={
          <PathProjects
            projects={projects.map((p) => ({
              id: p.id,
              title: p.title,
              status: p.status,
              techStack: p.techStack,
              entries: p._count.journal,
              lastEntry: p.journal[0]?.content ?? null,
            }))}
          />
        }
      />
    </PageMain>
  )
}
