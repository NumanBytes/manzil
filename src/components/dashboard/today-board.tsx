"use client"

import { useOptimistic, useState, useTransition } from "react"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardTitle, DoneToggle, Eyebrow, PageHeading } from "@/components/shared/primitives"
import { setTodayItem } from "@/actions/today"
import type { DailyItem } from "@/lib/activity"
import { cn } from "@/lib/utils"

export type TodayItem = {
  key: DailyItem
  title: string
  meta: string
  minutes: number
  href: string
  done: boolean
  focusBody: string
  focusNote: string
  cta: string
}

type Props = {
  dateLabel: string
  items: TodayItem[]
  week: { day: string; count: number | null; isToday: boolean }[]
  activeLast7: number
  tomorrow: string[]
}

const STEPS_PER_DAY = 4

function formatLeft(mins: number) {
  if (mins < 60) return `${mins} min`
  return `${Math.floor(mins / 60)} h ${mins % 60} min`
}

function formatMinutes(mins: number) {
  return mins >= 60 ? `${Math.round((mins / 60) * 10) / 10} h` : `${mins} min`
}

export function TodayBoard({ dateLabel, items, week, activeLast7, tomorrow }: Props) {
  const [optimistic, setOptimistic] = useOptimistic(
    items,
    (state, change: { key: DailyItem; done: boolean }) =>
      state.map((i) => (i.key === change.key ? { ...i, done: change.done } : i))
  )
  const [, startTransition] = useTransition()
  const [error, setError] = useState("")

  function toggle(key: DailyItem, done: boolean) {
    setError("")
    startTransition(async () => {
      setOptimistic({ key, done })
      const res = await setTodayItem(key, done)
      if (!res.success) setError("Not saved yet. Check your connection and try again.")
    })
  }

  const doneCount = optimistic.filter((i) => i.done).length
  const minsLeft = optimistic.filter((i) => !i.done).reduce((a, i) => a + i.minutes, 0)
  const focus = optimistic.find((i) => !i.done)
  const rest = optimistic.filter((i) => i !== focus)
  const allDone = optimistic.length > 0 && !focus

  return (
    <div className="flex flex-wrap items-start gap-7">
      <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <PageHeading>{dateLabel}</PageHeading>
          <span className="text-sm text-muted-foreground">
            {doneCount} of {Math.max(optimistic.length, STEPS_PER_DAY)} done
            {minsLeft > 0 ? ` · about ${formatLeft(minsLeft)} left` : ""}
          </span>
        </div>

        {error && (
          <p role="alert" className="m-0 rounded-lg bg-accent px-4 py-3 text-sm">
            {error}
          </p>
        )}

        {focus ? (
          <Card className="gap-3.5 border-2 border-primary p-[18px] md:p-7">
            <Eyebrow className="text-link">Do this now · {formatMinutes(focus.minutes)}</Eyebrow>
            <h2 className="m-0 font-heading text-[28px] leading-[1.2] font-bold">{focus.title}</h2>
            <p className="m-0 max-w-[62ch]">{focus.focusBody}</p>
            <p className="m-0 max-w-[62ch] text-sm text-muted-foreground">{focus.focusNote}</p>
            <div className="flex flex-wrap items-center gap-3">
              <Link href={focus.href} className={buttonVariants({ size: "lg" })}>
                {focus.cta}
              </Link>
              <span className="text-sm text-muted-foreground">{focus.meta}</span>
            </div>
          </Card>
        ) : allDone ? (
          <Card className="gap-3 border-2 border-fill p-[18px] md:p-7">
            <Eyebrow>All four done</Eyebrow>
            <h2 className="m-0 font-heading text-[28px] leading-[1.2] font-bold">Done for today. Stop.</h2>
            <p className="m-0 max-w-[62ch] text-muted-foreground">Rest is part of the plan. Tomorrow: {tomorrow[0]}</p>
          </Card>
        ) : (
          <Card className="gap-3 p-[18px] md:p-7">
            <h2 className="m-0 font-heading text-[22px] font-bold">Nothing is scheduled yet.</h2>
            <p className="m-0 text-muted-foreground">
              Draw your first path and Manzil fills this page with four things a day.
            </p>
          </Card>
        )}

        {rest.length > 0 && (
          <Card className="px-5 pt-2 pb-3">
            <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1 pt-3.5 pb-1.5">
              <CardTitle>{focus ? "The rest of today" : "Today"}</CardTitle>
              <span className="text-[13px] text-muted-foreground">Any order. Finished steps stay here, ticked.</span>
            </div>
            {rest.map((item) => (
              <div key={item.key} className="flex min-h-16 items-center gap-2.5 border-t border-border">
                <DoneToggle
                  done={item.done}
                  label={item.title}
                  className="-ml-2.5"
                  onToggle={() => toggle(item.key, !item.done)}
                />
                <Link
                  href={item.href}
                  className={cn("min-w-0 flex-1 py-2 no-underline", item.done ? "text-muted-foreground" : "text-foreground")}
                >
                  <span className="font-semibold">{item.title}</span>
                  <br />
                  <span className="text-sm text-muted-foreground">{item.done ? "Done today" : item.meta}</span>
                </Link>
                <span className="flex-none text-sm text-muted-foreground">{item.done ? "" : formatMinutes(item.minutes)}</span>
              </div>
            ))}
          </Card>
        )}
      </div>

      <aside className="flex min-w-0 flex-[1_1_300px] flex-col gap-5">
        <Card className="gap-3.5 p-[22px]">
          <div className="flex items-baseline justify-between gap-2">
            <CardTitle>This week</CardTitle>
            <span className="text-[13px] text-muted-foreground">{activeLast7} of the last 7 days</span>
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {week.map((d, i) => {
              const count = d.isToday ? doneCount : (d.count ?? 0)
              const full = !d.isToday && count >= STEPS_PER_DAY
              return (
                <div
                  key={i}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-lg border-2 py-2.5",
                    d.isToday ? "border-pin bg-card" : full ? "border-transparent bg-fill" : "border-transparent bg-muted"
                  )}
                >
                  <span className={cn("text-xs font-semibold", full ? "text-fill-foreground/75" : "text-muted-foreground")}>
                    {d.day}
                  </span>
                  <span className={cn("font-heading text-[15px] font-bold", full ? "text-fill-foreground" : "text-foreground")}>
                    {count}/{STEPS_PER_DAY}
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
          {tomorrow.map((line) => (
            <p key={line} className="m-0 text-sm text-muted-foreground">
              {line}
            </p>
          ))}
        </Card>
      </aside>
    </div>
  )
}
