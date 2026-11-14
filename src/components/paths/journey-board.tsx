"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, DoneToggle } from "@/components/shared/primitives"
import { Trail, type TrailNode } from "@/components/shared/trail"
import { CURRENT_MILESTONE, CURRENT_STEP_DETAIL, MAIN_PATH, MILESTONES } from "@/lib/sample-data"
import { cn } from "@/lib/utils"

export function JourneyBoard({ aside }: { aside: React.ReactNode }) {
  const [sel, setSel] = useState(CURRENT_MILESTONE)
  const [subDone, setSubDone] = useState<Record<number, boolean>>({ 0: true })

  const stops: TrailNode[] = MILESTONES.map((m, i) => ({
    label: i === MILESTONES.length - 1 ? "Full Stack Engineer" : m.title,
    state: i < CURRENT_MILESTONE ? "done" : i === CURRENT_MILESTONE ? "here" : "ahead",
  }))
  const milestone = MILESTONES[sel]

  return (
    <>
      <Card className="gap-[18px] p-[18px] md:px-7 md:py-6">
        <Trail nodes={stops} plan={MAIN_PATH.planAt} />
        <div role="tablist" aria-label="Milestones" className="flex flex-wrap gap-2">
          {MILESTONES.map((m, i) => {
            const on = i === sel
            const done = i < CURRENT_MILESTONE
            const here = i === CURRENT_MILESTONE
            return (
              <button
                key={m.title}
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
                        : done
                          ? "bg-fill text-fill-foreground"
                          : "bg-muted text-muted-foreground"
                  )}
                >
                  {done ? "✓" : i + 1}
                </span>
                {m.title}
              </button>
            )
          })}
        </div>
        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
          <div className="flex flex-col gap-0.5 rounded-lg bg-muted px-4 py-3.5">
            <span className="text-[13px] text-muted-foreground">Pace</span>
            <span className="font-heading text-[26px] leading-[1.1] font-bold md:text-[28px]">
              {MAIN_PATH.pacePerWeek} <span className="font-sans text-sm font-medium text-muted-foreground">a week</span>
            </span>
            <span className="text-[13px] text-muted-foreground">{MAIN_PATH.paceNeeded} lands on time</span>
          </div>
          <div className="flex flex-col gap-0.5 rounded-lg bg-muted px-4 py-3.5">
            <span className="text-[13px] text-muted-foreground">Lands on</span>
            <span className="font-heading text-[26px] leading-[1.1] font-bold md:text-[28px]">{MAIN_PATH.landsOn}</span>
            <span className="text-[13px] text-muted-foreground">target {MAIN_PATH.target}</span>
          </div>
          <div className="flex flex-col gap-2 rounded-lg bg-accent px-4 py-3.5">
            <span className="text-sm">
              {MAIN_PATH.daysBehind} days after your target. That is small; one extra hour this week closes it.
            </span>
            <div className="flex flex-wrap gap-2">
              <Button size="sm">Keep the date</Button>
              <Button size="sm" variant="outline" className="border-accent-ring">
                Move it {MAIN_PATH.daysBehind} days
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <div className="flex flex-wrap items-start gap-6">
        <Card role="tabpanel" className="min-w-0 flex-[999_1_560px] gap-1.5 p-[18px] md:px-7 md:py-6">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 pb-2.5">
            <h2 className="m-0 font-heading text-[22px] font-bold">{milestone.title}</h2>
            <span className="text-sm text-muted-foreground">{milestone.meta}</span>
          </div>
          <div className="relative flex flex-col gap-1.5">
            <div aria-hidden="true" className="absolute top-5 bottom-5 left-[21px] border-l-2 border-dashed border-ahead" />
            {milestone.steps.map((step) => {
              const here = step.status === "here"
              const done = step.status === "done"
              return (
                <div
                  key={step.title}
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
                      {step.kind}
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
                    <span className="flex-none text-sm text-muted-foreground">{done ? "done" : step.time}</span>
                  </div>

                  {here && (
                    <div className="flex flex-col gap-2.5 pl-[26px]">
                      <span className="text-[13px] font-semibold tracking-[0.06em] text-muted-foreground uppercase">
                        What to do, in order
                      </span>
                      {CURRENT_STEP_DETAIL.subtasks.map((u, i) => {
                        const d = !!subDone[i]
                        return (
                          <div key={u.text} className="flex items-start gap-2">
                            <DoneToggle
                              shape="square"
                              done={d}
                              label={u.text}
                              className="-my-2.5 -ml-3"
                              onToggle={() => setSubDone((s) => ({ ...s, [i]: !s[i] }))}
                            />
                            <span className={cn("min-w-0 flex-1 text-[15px]", d ? "text-off" : "text-foreground")}>
                              {u.text} <span className="text-[13px] text-muted-foreground">· {u.min} min</span>
                            </span>
                          </div>
                        )
                      })}
                      <p className="m-0 mt-0.5 text-sm text-body">
                        <span className="font-semibold">Done looks like:</span> {CURRENT_STEP_DETAIL.doneLooksLike}
                      </p>
                      <p className="m-0 text-sm text-body">
                        <span className="font-semibold">Use:</span> {CURRENT_STEP_DETAIL.use}
                      </p>
                      <div className="flex flex-wrap items-center gap-3">
                        <Button>Step done</Button>
                        <button
                          type="button"
                          className="cursor-pointer border-0 bg-transparent p-0 text-sm font-semibold text-link underline"
                        >
                          Still too big? Split it further
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
