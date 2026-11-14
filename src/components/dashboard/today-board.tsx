"use client"

import { useState } from "react"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardTitle, DoneToggle, Eyebrow, PageHeading } from "@/components/shared/primitives"
import { LAST_SIX_DAYS, TODAY_FOCUS, TODAY_STEPS, TOMORROW } from "@/lib/sample-data"
import { cn } from "@/lib/utils"

const STEPS_PER_DAY = 4

function formatLeft(mins: number) {
  return `${Math.floor(mins / 60)} h ${mins % 60} min`
}

export function TodayBoard({ dateLabel, dayShort }: { dateLabel: string; dayShort: string }) {
  const [done, setDone] = useState<Record<string, boolean>>({ lesson: true })

  const doneCount = Object.values(done).filter(Boolean).length
  const minsLeft = TODAY_FOCUS.minutes + TODAY_STEPS.filter((s) => !done[s.key]).reduce((a, s) => a + s.minutes, 0)
  const week = [...LAST_SIX_DAYS, { day: dayShort, count: doneCount }]
  const activeDays = week.filter((d) => d.count > 0).length

  return (
    <div className="flex flex-wrap items-start gap-7">
      <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <PageHeading>{dateLabel}</PageHeading>
          <span className="text-sm text-muted-foreground">
            {doneCount} of {STEPS_PER_DAY} done · about {formatLeft(minsLeft)} left
          </span>
        </div>

        <Card className="gap-3.5 border-2 border-primary p-[18px] md:p-7">
          <Eyebrow className="text-link">{TODAY_FOCUS.eyebrow}</Eyebrow>
          <h2 className="m-0 font-heading text-[28px] leading-[1.2] font-bold">{TODAY_FOCUS.title}</h2>
          <p className="m-0 max-w-[62ch]">{TODAY_FOCUS.prompt}</p>
          <p className="m-0 max-w-[62ch] text-sm text-muted-foreground">{TODAY_FOCUS.explainer}</p>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/practice" className={buttonVariants({ size: "lg" })}>
              Start the drill
            </Link>
            <span className="text-sm text-muted-foreground">{TODAY_FOCUS.meta}</span>
          </div>
        </Card>

        <Card className="px-5 pt-2 pb-3">
          <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1 pt-3.5 pb-1.5">
            <CardTitle>The rest of today</CardTitle>
            <span className="text-[13px] text-muted-foreground">Any order. Finished steps stay here, ticked.</span>
          </div>
          {TODAY_STEPS.map((step) => {
            const isDone = !!done[step.key]
            return (
              <div key={step.key} className="flex min-h-16 items-center gap-2.5 border-t border-border">
                <DoneToggle
                  done={isDone}
                  label={step.title}
                  className="-ml-2.5"
                  onToggle={() => setDone((d) => ({ ...d, [step.key]: !d[step.key] }))}
                />
                <Link
                  href={step.href}
                  className={cn("min-w-0 flex-1 no-underline", isDone ? "text-muted-foreground" : "text-foreground")}
                >
                  <span className="font-semibold">{step.title}</span>
                  <br />
                  <span className="text-sm text-muted-foreground">{isDone ? "Done today" : step.meta}</span>
                </Link>
                <span className="flex-none text-sm text-muted-foreground">{isDone ? "" : step.time}</span>
              </div>
            )
          })}
        </Card>
      </div>

      <aside className="flex min-w-0 flex-[1_1_300px] flex-col gap-5">
        <Card className="gap-3.5 p-[22px]">
          <div className="flex items-baseline justify-between gap-2">
            <CardTitle>This week</CardTitle>
            <span className="text-[13px] text-muted-foreground">{activeDays} of the last 7 days</span>
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {week.map((d, i) => {
              const isToday = i === week.length - 1
              const full = !isToday && d.count >= STEPS_PER_DAY
              return (
                <div
                  key={i}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-lg border-2 py-2.5",
                    isToday ? "border-pin bg-card" : full ? "border-transparent bg-fill" : "border-transparent bg-muted"
                  )}
                >
                  <span className={cn("text-xs font-semibold", full ? "text-fill-foreground/75" : "text-muted-foreground")}>
                    {d.day}
                  </span>
                  <span className={cn("font-heading text-[15px] font-bold", full ? "text-fill-foreground" : "text-foreground")}>
                    {d.count}/{STEPS_PER_DAY}
                  </span>
                </div>
              )
            })}
          </div>
          <p className="m-0 text-[13px] text-muted-foreground">
            Missed a day? Nothing is lost. Unfinished steps move forward and your plan date recomputes; your scores stay put.
          </p>
        </Card>

        <Card className="gap-2.5 p-[22px]">
          <CardTitle>Tomorrow</CardTitle>
          {TOMORROW.map((line) => (
            <p key={line} className="m-0 text-sm text-muted-foreground">
              {line}
            </p>
          ))}
        </Card>
      </aside>
    </div>
  )
}
