"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, DoneToggle } from "@/components/shared/primitives"
import { Trail, type TrailNode } from "@/components/shared/trail"
import { moveTargetDate, setStepDone, toggleSubtask } from "@/actions/paths"
import { cn } from "@/lib/utils"

type Step = {
  id: string
  kind: "LEARN" | "BUILD" | "PROVE"
  title: string
  hours: number
  isCompleted: boolean
  doneLooksLike: string | null
  resourceNote: string | null
  subtasks: { id: string; title: string; minutes: number; done: boolean }[]
}
type Milestone = { id: string; title: string; why: string | null; isCompleted: boolean; completedAt: string | null; steps: Step[] }

type Props = {
  path: { id: string; goal: string; weeklyHours: number; milestones: Milestone[] }
  stats: {
    stops: TrailNode[]
    trailPlan: number
    finished: boolean
    currentMilestoneIndex: number
    currentStepId: string | null
    paceWeekly: number
    paceIsActual: boolean
    neededWeekly: number
    landsOn: string
    target: string
    daysLate: number
  }
  aside: React.ReactNode
}

const KIND = { LEARN: "Learn", BUILD: "Build", PROVE: "Prove" } as const
const fmtH = (h: number) => (h < 1 ? `${Math.round(h * 60)} min` : `${Math.round(h * 10) / 10} h`)

export function JourneyBoard({ path, stats, aside }: Props) {
  const router = useRouter()
  const [sel, setSel] = useState(Math.max(0, stats.currentMilestoneIndex))
  const [pending, start] = useTransition()
  const [splitting, setSplitting] = useState(false)
  const [error, setError] = useState("")

  const milestone = path.milestones[sel] ?? path.milestones[0]
  const doneSteps = milestone.steps.filter((s) => s.isCompleted).length
  const hours = milestone.steps.reduce((a, s) => a + s.hours, 0)

  function run(fn: () => Promise<{ success: boolean; error?: string }>) {
    setError("")
    start(async () => {
      const res = await fn()
      if (!res.success) setError(res.error ?? "Not saved yet. Try again.")
    })
  }

  async function split(stepId: string) {
    setError("")
    setSplitting(true)
    try {
      const res = await fetch("/api/ai/split-step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stepId }),
      })
      if (!res.ok) setError((await res.json().catch(() => null))?.error ?? "Couldn't split the step.")
      else router.refresh()
    } finally {
      setSplitting(false)
    }
  }

  const late = stats.daysLate
  return (
    <>
      <Card className="gap-[18px] p-[18px] md:px-7 md:py-6">
        <Trail nodes={stats.stops} plan={stats.trailPlan} />
        <div role="tablist" aria-label="Milestones" className="flex flex-wrap gap-2">
          {path.milestones.map((m, i) => {
            const on = i === sel
            const here = i === stats.currentMilestoneIndex
            return (
              <button
                key={m.id}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setSel(i)}
                className={cn(
                  "inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border-2 px-3.5 text-sm font-semibold",
                  on ? "border-fill bg-fill text-fill-foreground" : "border-border bg-card text-foreground hover:bg-muted"
                )}
              >
                <span
                  className={cn(
                    "grid size-5 place-items-center rounded-full text-[11px]",
                    on
                      ? "bg-fill-foreground text-fill"
                      : here
                        ? "bg-pin text-white"
                        : m.isCompleted
                          ? "bg-fill text-fill-foreground"
                          : "bg-muted text-muted-foreground"
                  )}
                >
                  {m.isCompleted ? "✓" : i + 1}
                </span>
                {m.title}
              </button>
            )
          })}
        </div>

        {stats.finished ? (
          <p className="m-0 rounded-lg bg-accent px-4 py-3.5">
            <span className="font-bold">You arrived.</span> Every milestone on this path is done. Draw the next one when
            you&apos;re ready.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
            <div className="flex flex-col gap-0.5 rounded-lg bg-muted px-4 py-3.5">
              <span className="text-[13px] text-muted-foreground">Pace</span>
              <span className="font-heading text-[26px] leading-[1.1] font-bold md:text-[28px]">
                {fmtH(stats.paceWeekly)} <span className="font-sans text-sm font-medium text-muted-foreground">a week</span>
              </span>
              <span className="text-[13px] text-muted-foreground">
                {stats.paceIsActual ? "from the last 4 weeks" : "what you said you'd keep"} · {fmtH(stats.neededWeekly)} lands on
                time
              </span>
            </div>
            <div className="flex flex-col gap-0.5 rounded-lg bg-muted px-4 py-3.5">
              <span className="text-[13px] text-muted-foreground">Lands on</span>
              <span className="font-heading text-[26px] leading-[1.1] font-bold md:text-[28px]">{stats.landsOn}</span>
              <span className="text-[13px] text-muted-foreground">target {stats.target}</span>
            </div>
            <div className="flex flex-col gap-2 rounded-lg bg-accent px-4 py-3.5">
              {late > 1 ? (
                <>
                  <span className="text-sm">
                    {late} days after your target.{" "}
                    {late <= 14
                      ? `That is small; about ${fmtH(Math.max(0.5, stats.neededWeekly - stats.paceWeekly))} more a week closes it.`
                      : late > 21
                        ? "That's more than three weeks. Moving the date is the honest option."
                        : `About ${fmtH(Math.max(0.5, stats.neededWeekly - stats.paceWeekly))} more a week closes it.`}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => router.push("/dashboard")}>
                      Keep the date
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-accent-ring"
                      disabled={pending}
                      onClick={() => run(() => moveTargetDate(path.id, late))}
                    >
                      Move it {late} days
                    </Button>
                  </div>
                </>
              ) : (
                <span className="text-sm">
                  {late < -1 ? `${-late} days ahead of your target. Keep this pace.` : "On pace for your target date."}
                </span>
              )}
            </div>
          </div>
        )}
      </Card>

      {error && (
        <p role="alert" className="m-0 rounded-lg bg-accent px-4 py-3 text-sm">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-start gap-6">
        <Card role="tabpanel" className="min-w-0 flex-[999_1_560px] gap-1.5 p-[18px] md:px-7 md:py-6">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <h2 className="m-0 font-heading text-[22px] font-bold">{milestone.title}</h2>
            <span className="text-sm text-muted-foreground">
              {doneSteps} of {milestone.steps.length} steps · {fmtH(hours)}
              {milestone.completedAt ? ` · done ${milestone.completedAt}` : ""}
            </span>
          </div>
          {milestone.why && <p className="m-0 pb-2.5 text-sm text-muted-foreground">{milestone.why}</p>}
          <div className="relative flex flex-col gap-1.5">
            <div aria-hidden="true" className="absolute top-5 bottom-5 left-[21px] border-l-2 border-dashed border-ahead" />
            {milestone.steps.map((step) => {
              const here = step.id === stats.currentStepId
              const done = step.isCompleted
              return (
                <div
                  key={step.id}
                  className={cn(
                    "relative flex flex-col gap-3 rounded-lg border-2 bg-card px-4 py-3",
                    here ? "border-pin" : "border-border"
                  )}
                >
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <span
                      aria-hidden="true"
                      className={cn(
                        "box-border size-3.5 flex-none rounded-full border-2",
                        here
                          ? "border-pin bg-pin shadow-[0_0_0_5px_var(--pin-soft)]"
                          : done
                            ? "border-fill bg-fill"
                            : "border-off bg-card"
                      )}
                    />
                    <span className="flex-none rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-body">
                      {KIND[step.kind]}
                    </span>
                    <span
                      className={cn(
                        "min-w-0 flex-[999_1_200px]",
                        here ? "font-bold" : "font-medium",
                        done ? "text-off" : "text-foreground"
                      )}
                    >
                      {here && (
                        <span className="block text-[11px] font-bold tracking-[0.06em] text-pin-ink uppercase">
                          You are here
                        </span>
                      )}
                      {step.title}
                    </span>
                    {done ? (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => run(() => setStepDone(step.id, false))}
                        className="flex-none cursor-pointer border-0 bg-transparent p-0 text-sm text-muted-foreground underline"
                        aria-label={`Mark not done: ${step.title}`}
                      >
                        done
                      </button>
                    ) : (
                      <span className="flex-none text-sm text-muted-foreground">{fmtH(step.hours)}</span>
                    )}
                  </div>

                  {here && (
                    <div className="flex flex-col gap-2.5 pl-[26px]">
                      {step.subtasks.length > 0 ? (
                        <>
                          <span className="text-[13px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">
                            What to do, in order
                          </span>
                          {step.subtasks.map((u) => (
                            <div key={u.id} className="flex items-start gap-2">
                              <DoneToggle
                                shape="square"
                                done={u.done}
                                label={u.title}
                                className="-my-2.5 -ml-3"
                                onToggle={() => run(() => toggleSubtask(u.id))}
                              />
                              <span className={cn("min-w-0 flex-1 text-[15px]", u.done ? "text-off" : "text-foreground")}>
                                {u.title} <span className="text-[13px] text-muted-foreground">· {u.minutes} min</span>
                              </span>
                            </div>
                          ))}
                        </>
                      ) : (
                        <p className="m-0 text-sm text-muted-foreground">
                          Not sure where to start? Manzil can split this into timed sub-tasks with what done looks like.
                        </p>
                      )}
                      {step.doneLooksLike && (
                        <p className="m-0 mt-0.5 text-sm text-body">
                          <span className="font-semibold">Done looks like:</span> {step.doneLooksLike}
                        </p>
                      )}
                      {step.resourceNote && (
                        <p className="m-0 text-sm text-body">
                          <span className="font-semibold">Use:</span> {step.resourceNote}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-3">
                        <Button disabled={pending} onClick={() => run(() => setStepDone(step.id, true))}>
                          Step done
                        </Button>
                        <button
                          type="button"
                          disabled={splitting}
                          onClick={() => split(step.id)}
                          className="cursor-pointer border-0 bg-transparent p-0 text-sm font-semibold text-link underline disabled:opacity-60"
                        >
                          {splitting
                            ? "Splitting…"
                            : step.subtasks.length
                              ? "Still too big? Split it further"
                              : "Split it into sub-tasks"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </Card>

        <aside className="flex min-w-0 flex-[1_1_300px] flex-col gap-5">{aside}</aside>
      </div>
    </>
  )
}
