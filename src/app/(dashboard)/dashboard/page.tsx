import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { requireUser } from "@/lib/session"
import { buttonVariants } from "@/components/ui/button"
import { Trail } from "@/components/shared/trail"
import { PageMain } from "@/components/shared/primitives"
import { TodayBoard, type TodayItem } from "@/components/dashboard/today-board"
import { addDays, aroundToday, dayKey, daysBetween, formatDate, isToday, lastNDays, longDate, shortWeekday, todayKey, weekday } from "@/lib/dates"
import { countDone } from "@/lib/activity"
import { formatHours, pathStats, paceSentence } from "@/lib/pace"
import { getReadiness } from "@/lib/readiness"
import { currentStep, getMainPath } from "@/lib/data/journey"
import { getTodaysLesson } from "@/lib/data/library"
import { getDrillOfDay, getProblemOfDay } from "@/lib/data/practice"

export default async function TodayPage() {
  const user = await requireUser()
  const today = todayKey(user.timezone)
  const week = lastNDays(today, 7)

  const [path, days, lessonInfo, problemInfo, drill, readiness, recentRead, recentStep] = await Promise.all([
    getMainPath(user.id),
    prisma.dayActivity.findMany({ where: { userId: user.id, day: { gte: addDays(today, -13) } } }),
    getTodaysLesson(user.id, user),
    getProblemOfDay(user.id, user.timezone),
    getDrillOfDay(user.id, user.timezone),
    getReadiness(user.id, user.timezone),
    prisma.lessonRead.findFirst({
      where: { userId: user.id, readAt: { gte: aroundToday() } },
      orderBy: { readAt: "desc" },
      include: { lesson: { select: { number: true, title: true, module: true } } },
    }),
    prisma.step.findFirst({
      where: { isCompleted: true, completedAt: { gte: aroundToday() }, milestone: { path: { userId: user.id, isMain: true } } },
      orderBy: { completedAt: "desc" },
      include: { milestone: { select: { title: true } } },
    }),
  ])
  const byDay = new Map(days.map((d) => [d.day, d]))
  const todayRow = byDay.get(today)
  const stats = path ? pathStats(path) : null
  const current = path ? currentStep(path) : null
  // Finished items stay on Today, ticked, instead of being replaced by the next one.
  const lessonToday = recentRead && isToday(recentRead.readAt, user.timezone) ? recentRead.lesson : null
  const lesson = lessonToday ?? lessonInfo.lesson
  const stepToday =
    recentStep?.completedAt && isToday(recentStep.completedAt, user.timezone)
      ? { step: recentStep, milestone: recentStep.milestone }
      : null
  const build = stepToday ?? current

  const items: TodayItem[] = [
    drill
      ? {
          key: "drill",
          title: `Drill: ${drill.title}`,
          meta: `${drill.track} · ${drill.isNew ? "new topic" : `review, you scored it ${drill.lastScore}`}`,
          minutes: 15,
          href: "/practice#drill",
          done: !!todayRow?.drill,
          focusBody: drill.prompt,
          focusNote:
            "A drill is a 15-minute spoken answer to one concept question, with no notes. Afterwards you score yourself 1 to 4, and Manzil decides when the topic comes back.",
          cta: "Start the drill",
        }
      : null,
    problemInfo.problem
      ? {
          key: "solve",
          title: `${problemInfo.isRedo ? "Redo" : `Solve problem ${problemInfo.problem.order}`}: ${problemInfo.problem.title}`,
          meta: problemInfo.isRedo ? "Sunday redo: one you couldn't solve last week" : "One problem a day, AI off",
          minutes: 30,
          href: "/practice#solve",
          done: !!todayRow?.solve,
          focusBody: `${problemInfo.problem.pattern}. Say your approach out loud before you type. Thirty minutes, then stop whatever happens.`,
          focusNote: "AI off: no Claude, Copilot or Cursor while you work. Interviews won't have them either.",
          cta: "Open the problem timer",
        }
      : null,
    build
      ? {
          key: "build",
          title: `Build: ${build.step.title}`,
          meta: `${path!.title} · ${build.milestone.title}`,
          minutes: Math.round((build.step.estimatedHours ?? 1) * 60),
          href: "/paths",
          done: !!todayRow?.build,
          focusBody: build.step.title,
          focusNote: build.step.doneLooksLike
            ? `Done looks like: ${build.step.doneLooksLike}`
            : "The next step on your path. Open it to see the sub-tasks, or split it if it feels too big.",
          cta: "Open the step",
        }
      : null,
    lesson
      ? {
          key: "lesson",
          title: `Read Lesson ${lesson.number}: ${lesson.title}`,
          meta: lesson.module,
          minutes: 5,
          href: `/library?n=${lesson.number}`,
          done: !!todayRow?.lesson,
          focusBody: `Lesson ${lesson.number} of the course, in plain words. Five minutes.`,
          focusNote: "Read it, answer its interview question out loud, then mark it read.",
          cta: "Read the lesson",
        }
      : null,
  ].filter((x): x is TodayItem => !!x)

  const weekStrip = week.map((d) => ({
    day: shortWeekday(d),
    count: d === today ? null : countDone(byDay.get(d)),
    isToday: d === today,
  }))
  const activeLast7 = week.filter((d) => countDone(byDay.get(d)) > 0).length

  // Calm sentence after missed days.
  let missed = 0
  for (let i = 1; i <= 7; i++) {
    const d = addDays(today, -i)
    if (countDone(byDay.get(d)) > 0) break
    missed++
  }
  const accountDays = daysBetween(dayKey(user.courseStartedAt, user.timezone), today)
  if (missed > accountDays) missed = accountDays

  const tomorrow = addDays(today, 1)
  const tomorrowParts = [
    lessonInfo.next ? `Lesson ${lessonInfo.next.number}: ${lessonInfo.next.title}` : null,
    "one drill",
    "one problem",
    path ? "one path step" : null,
  ].filter(Boolean)

  return (
    <PageMain>
      {path && stats ? (
        <section className="flex flex-col gap-[18px] rounded-card bg-hero px-[18px] pt-[18px] pb-5 text-hero-foreground md:px-8 md:py-6">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
            <p className="m-0 font-heading text-lg leading-[1.3] font-bold">
              <span className="mr-3 font-sans text-xs font-semibold tracking-[0.08em] text-hero-soft uppercase">
                Your manzil
              </span>
              {user.goal ?? path.title}
            </p>
            <span className="text-sm text-hero-muted">
              {path.goal} by {formatDate(path.targetDate, { month: "long", year: "numeric" })}
            </span>
          </div>
          <Trail nodes={stats.stops} plan={stats.trailPlan} onHero />
          <p className="m-0 text-sm text-hero-muted">
            {paceSentence(stats)}
            {stats.daysBehindPlan > 1 && !stats.finished
              ? ` About ${formatHours(Math.max(0.5, stats.neededWeekly - path.weeklyHours))} extra a week closes it.`
              : ""}{" "}
            <Link href="/progress" className="text-hero-foreground underline">
              Interview readiness {readiness.score} of 100
            </Link>
          </p>
        </section>
      ) : (
        <section className="flex flex-col gap-4 rounded-card bg-hero px-[18px] py-6 text-hero-foreground md:px-8">
          <span className="text-xs font-semibold tracking-[0.08em] text-hero-soft uppercase">Your manzil</span>
          <h2 className="m-0 font-heading text-2xl leading-tight font-bold">Name your destination first.</h2>
          <p className="m-0 max-w-[60ch] text-hero-muted">
            Answer seven questions and Manzil draws your path in small steps. Until then, the lesson, drill and problem
            below still count.
          </p>
          <Link href="/paths/new" className={buttonVariants({ size: "lg", className: "self-start" })}>
            Draw my path
          </Link>
        </section>
      )}

      {missed >= 2 && (
        <p role="status" className="m-0 rounded-lg bg-accent px-4 py-3 text-sm">
          You missed {missed} days. Nothing is lost: today starts where you left off, and your scores stay put.
        </p>
      )}

      <TodayBoard
        dateLabel={longDate(today)}
        items={items}
        week={weekStrip}
        activeLast7={activeLast7}
        tomorrow={[
          `${tomorrowParts.join(" · ")}.`,
          weekday(tomorrow) === 0 ? "Sunday is also redo day: one problem you couldn't solve comes back." : null,
        ].filter((x): x is string => !!x)}
      />
    </PageMain>
  )
}
