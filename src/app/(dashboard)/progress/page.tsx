import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/session"
import { buttonVariants } from "@/components/ui/button"
import { Card, Eyebrow, Meter, PageHeading, PageMain } from "@/components/shared/primitives"
import { Trail } from "@/components/shared/trail"
import { RefreshReadButton } from "@/components/dashboard/refresh-read-button"
import { dayKey, daysBetween, formatDate, lastNDays, shortWeekday, todayKey } from "@/lib/dates"
import { countDone } from "@/lib/activity"
import { getReadiness, readinessScale } from "@/lib/readiness"
import { dueLabel } from "@/lib/data/practice"
import type { WeeklyRead } from "@/lib/ai/prompts"
import { cn } from "@/lib/utils"

const LEVEL = [
  { label: "nothing", bar: "h-2 bg-border" },
  { label: "part of the day", bar: "h-4 bg-off" },
  { label: "all four steps", bar: "h-6 bg-fill" },
]

export default async function ProgressPage() {
  const user = await requireUser()
  const today = todayKey(user.timezone)
  const days28 = lastNDays(today, 28)
  const weekOld = daysBetween(dayKey(user.courseStartedAt, user.timezone), today) >= 7

  const [readiness, activity, weakest, report] = await Promise.all([
    getReadiness(user.id, user.timezone),
    prisma.dayActivity.findMany({ where: { userId: user.id, day: { gte: days28[0] } } }),
    prisma.topicReview.findFirst({
      where: { userId: user.id, score: { lte: 2 } },
      orderBy: [{ score: "asc" }, { dueAt: "asc" }],
      include: { topic: { select: { title: true, slug: true } } },
    }),
    prisma.weeklyReport.findFirst({ where: { userId: user.id }, orderBy: { generatedAt: "desc" } }),
  ])

  const byDay = new Map(activity.map((a) => [a.day, countDone(a)]))
  const levels = days28.map((d) => {
    const c = byDay.get(d) ?? 0
    return c === 0 ? 0 : c >= 4 ? 2 : 1
  })
  const active = levels.filter(Boolean).length
  const last14 = levels.slice(14).filter(Boolean).length
  // Pad the grid so columns line up with weekdays.
  const firstDow = shortWeekday(days28[0])
  const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  const lead = DOW.indexOf(firstDow)

  let read: WeeklyRead | null = null
  try {
    read = report ? (JSON.parse(report.content) as WeeklyRead) : null
  } catch {}

  return (
    <PageMain>
      <div className="flex flex-col gap-1.5">
        <Eyebrow>Progress</Eyebrow>
        <PageHeading>Are you ready to interview?</PageHeading>
      </div>

      <div className="flex flex-wrap items-start gap-7">
        <Card className="min-w-0 flex-[999_1_560px] gap-[22px] p-[18px] md:px-8 md:py-7">
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
            <span className="font-heading text-[56px] leading-none font-bold">{readiness.score}</span>
            <span className="text-lg text-muted-foreground">
              out of 100 · <span className="font-semibold text-foreground">{readiness.band}</span>
            </span>
            {readiness.hasHistory && weekOld && (
              <span className="ml-auto text-sm text-muted-foreground">
                {readiness.delta === 0 ? "same as a week ago" : `${readiness.delta > 0 ? "up" : "down"} ${Math.abs(readiness.delta)} since a week ago`}
              </span>
            )}
          </div>
          <Trail nodes={readinessScale(readiness.score)} />
          <p className="m-0 max-w-[70ch] text-sm text-muted-foreground">
            {readiness.hasHistory
              ? "Self-scored, so use it as a compass: mocks and real interviews are the proof. The score can fall when a topic you scored well comes back due and you score it lower. That is the system working, not you slipping."
              : "Your score fills in after your first drill or problem. It's self-scored, so treat it as a compass, not a verdict."}
          </p>
          <div className="flex flex-col gap-4 pt-1.5">
            {readiness.parts.map((p) => (
              <div key={p.name} className="flex flex-col gap-1.5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span>
                    <span className="font-semibold">{p.name}</span> <span className="text-sm text-muted-foreground">{p.note}</span>
                  </span>
                  <span className="text-sm font-semibold text-body">
                    {p.score} of {p.max}
                  </span>
                </div>
                <Meter pct={Math.round((p.score / p.max) * 100)} />
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3 rounded-lg bg-accent px-[18px] py-4">
            {weakest ? (
              <>
                <span className="flex-[999_1_300px]">
                  <span className="font-bold">Next best move.</span> Fix your weakest topic first: {weakest.topic.title}, scored{" "}
                  {weakest.score}, {dueLabel(weakest.dueAt)}.
                </span>
                <Link href={`/practice?topic=${weakest.topic.slug}#drill`} className={cn(buttonVariants(), "flex-none")}>
                  Drill it now
                </Link>
              </>
            ) : (
              <>
                <span className="flex-[999_1_300px]">
                  <span className="font-bold">Next best move.</span>{" "}
                  {readiness.hasHistory ? "Nothing is weak right now. Keep today's four things going." : "Do today's drill: it starts your score."}
                </span>
                <Link href="/practice#drill" className={cn(buttonVariants(), "flex-none")}>
                  Go to practice
                </Link>
              </>
            )}
          </div>
        </Card>

        <aside className="flex min-w-0 flex-[1_1_340px] flex-col gap-5">
          <section className="flex flex-col gap-3 rounded-card bg-hero p-6 text-hero-foreground">
            <Eyebrow className="text-hero-soft">Honest read of the week</Eyebrow>
            {read ? (
              <>
                <p className="m-0 font-heading text-lg leading-normal font-medium">{read.read}</p>
                <p className="m-0 text-hero-muted">
                  <span className="font-semibold text-hero-foreground">One change:</span> {read.oneChange}
                </p>
                <p className="m-0 text-[13px] text-ahead">
                  Written by AI from your logs on {formatDate(report!.generatedAt, { weekday: "long", day: "numeric", month: "long" })}.
                  It can be wrong; your logs are the record.
                </p>
              </>
            ) : (
              <p className="m-0 text-hero-muted">
                Once you have a few days of logs, Claude reads them and writes what actually happened this week, plus one
                change for next week.
              </p>
            )}
            <RefreshReadButton label={read ? "Refresh the read" : "Write this week's read"} />
          </section>
        </aside>
      </div>

      <Card className="gap-3.5 px-[18px] py-6 md:px-7">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="m-0 font-heading text-[22px] font-bold">Last 4 weeks</h2>
          <span className="text-sm text-muted-foreground">
            {active} active {active === 1 ? "day" : "days"} of 28 · {last14} of the last 14
          </span>
        </div>
        <div className="grid max-w-[560px] grid-cols-7 gap-2">
          {DOW.map((d) => (
            <span key={d} className="text-center text-xs font-semibold text-muted-foreground">
              {d}
            </span>
          ))}
          {Array.from({ length: lead }, (_, i) => (
            <span key={`pad${i}`} aria-hidden="true" />
          ))}
          {levels.map((v, i) => {
            const isToday = days28[i] === today
            return (
              <span
                key={days28[i]}
                role="img"
                aria-label={`${formatDate(new Date(days28[i] + "T00:00:00Z"), { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" })}: ${LEVEL[v].label}${isToday ? ", today" : ""}`}
                className="flex h-8 items-end"
              >
                <span className={cn("box-border block w-full rounded-md border-2", LEVEL[v].bar, isToday ? "border-pin" : "border-transparent")} />
              </span>
            )
          })}
        </div>
        <div className="flex flex-wrap gap-4 text-[13px] text-muted-foreground">
          {LEVEL.map((l) => (
            <span key={l.label} className="inline-flex items-center gap-1.5">
              <span className={cn("w-[18px] rounded", l.bar)} />
              {l.label}
            </span>
          ))}
        </div>
      </Card>
    </PageMain>
  )
}
