import Link from "next/link"
import { requireUser } from "@/lib/session"
import { Card, CardTitle, Eyebrow, PageHeading, PageMain } from "@/components/shared/primitives"
import { Trail, type TrailNode } from "@/components/shared/trail"
import { SolveCard } from "@/components/practice/solve-card"
import { DrillCard } from "@/components/practice/drill-card"
import { dueLabel, getDrillOfDay, getPracticeOverview, getProblemOfDay } from "@/lib/data/practice"
import { cn } from "@/lib/utils"

export default async function PracticePage({ searchParams }: { searchParams: Promise<{ topic?: string; track?: string }> }) {
  const user = await requireUser()
  const { topic, track } = await searchParams
  const [problem, drill, overview] = await Promise.all([
    getProblemOfDay(user.id, user.timezone),
    getDrillOfDay(user.id, user.timezone, { topicSlug: topic, track }),
    getPracticeOverview(user.id),
  ])

  const mockStops: TrailNode[] = [
    ...Array.from({ length: overview.mock.needed }, (_, i) => ({
      label: "",
      state: (i < overview.mock.drillsDone ? "done" : i === overview.mock.drillsDone ? "here" : "ahead") as TrailNode["state"],
    })),
    { label: "Mock 1", state: overview.mock.unlocked ? "here" : "ahead" },
  ]
  const left = overview.mock.needed - overview.mock.drillsDone

  return (
    <PageMain>
      <div className="flex flex-col gap-1.5">
        <Eyebrow>Interview practice</Eyebrow>
        <PageHeading>One problem. One drill. Then stop.</PageHeading>
        <p className="m-0 max-w-[64ch] text-muted-foreground">
          Manzil picks both for you. Weak answers come back sooner; strong ones come back later. AI off means no Claude,
          Copilot or Cursor while you work: interviews won&apos;t have them either.
        </p>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(440px,100%),1fr))] gap-5">
        <SolveCard
          key={problem.problem?.id ?? "none"}
          problem={
            problem.problem
              ? {
                  id: problem.problem.id,
                  order: problem.problem.order,
                  title: problem.problem.title,
                  url: problem.problem.url,
                  pattern: problem.problem.pattern,
                  difficulty: problem.problem.difficulty,
                }
              : null
          }
          total={problem.total}
          isRedo={problem.isRedo}
          redoOfLogId={problem.redoOfLogId}
          loggedToday={problem.doneToday ? { outcome: problem.doneToday.outcome, minutes: problem.doneToday.minutes } : null}
        />
        {drill ? (
          <DrillCard key={drill.id} drill={drill} />
        ) : (
          <Card className="gap-3 p-[18px] md:p-7">
            <h2 className="m-0 font-heading text-[22px] font-bold">No drill topics yet.</h2>
            <p className="m-0 text-muted-foreground">Run the database seed to load the topic list.</p>
          </Card>
        )}
      </div>

      <Card className="flex-row flex-wrap items-center gap-x-10 gap-y-5 px-[18px] py-6 md:px-7">
        <div className="flex min-w-0 flex-[999_1_420px] flex-col gap-2">
          <Eyebrow>Mock interviews</Eyebrow>
          <h2 className="m-0 font-heading text-[22px] font-bold">
            {overview.mock.unlocked ? "You've done enough drills for a first mock" : `Unlocks after ${left} more ${left === 1 ? "drill" : "drills"}`}
          </h2>
          <p className="m-0 text-sm text-muted-foreground">
            A mock is about 90 minutes: two problems, four concept questions and three about your own CV, one at a time with
            a timer, each scored 1 to 4. The mock runner isn&apos;t built into Manzil yet, so for now it counts as 0 in your
            readiness score. Until then, drills are the best preparation.
          </p>
        </div>
        <div className="min-w-0 flex-[1_1_280px]">
          <Trail nodes={mockStops} labels={false} />
          <p className="m-0 mt-1.5 text-right text-[13px] text-muted-foreground">
            {overview.mock.drillsDone} of {overview.mock.needed} drills
          </p>
        </div>
      </Card>

      <div className="flex flex-wrap items-start gap-7">
        <section className="flex min-w-0 flex-[999_1_560px] flex-col gap-3.5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="m-0 font-heading text-[22px] font-bold">Topics</h2>
            <span className="text-sm text-muted-foreground">
              {overview.totalTopics} topics. Pips: your average self-score. Pick a track to drill it next.
            </span>
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(260px,100%),1fr))] gap-3">
            {overview.tracks.map((t) => (
              <Link
                key={t.name}
                href={`/practice?track=${encodeURIComponent(t.name)}#drill`}
                aria-current={track === t.name ? "true" : undefined}
                className={cn(
                  "flex min-h-11 flex-col gap-2.5 rounded-lg border bg-card p-[18px] text-foreground no-underline hover:bg-muted",
                  track === t.name ? "border-fill" : "border-border"
                )}
              >
                <span className="flex items-baseline justify-between gap-2">
                  <span className="font-semibold">{t.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {t.drilled} of {t.total} drilled
                  </span>
                </span>
                <span role="img" aria-label={`average score ${t.level} of 4`} className="flex gap-1">
                  {[1, 2, 3, 4].map((k) => (
                    <span key={k} className={cn("h-1.5 w-6 rounded-full", k <= t.level ? "bg-fill" : "bg-border")} />
                  ))}
                </span>
              </Link>
            ))}
          </div>
        </section>

        <Card as="aside" className="min-w-0 flex-[1_1_320px] gap-1 p-[22px]">
          <CardTitle>Weak spots</CardTitle>
          <p className="mx-0 mt-1 mb-2 text-sm text-muted-foreground">
            Anything you score 1 or 2 stays here until you score it 3 or better. Normal: this is where the learning is.
          </p>
          {overview.weak.length === 0 ? (
            <p className="m-0 border-t border-border py-3 text-sm text-muted-foreground">Nothing weak right now.</p>
          ) : (
            overview.weak.map((w) => (
              <div key={w.slug} className="flex items-center gap-3 border-t border-border py-3">
                <span className="min-w-0 flex-1">
                  <span className="font-semibold">{w.title}</span>
                  <br />
                  <span className="text-sm text-muted-foreground">
                    Scored {w.score} · {dueLabel(w.dueAt)}
                  </span>
                </span>
                <span className="flex flex-none flex-col items-end gap-1">
                  <Link href={`/practice?topic=${w.slug}#drill`} className="text-sm font-semibold text-link underline">
                    Drill now
                  </Link>
                  {w.lessonNumber && (
                    <Link href={`/library?n=${w.lessonNumber}`} className="text-sm text-link underline">
                      Reread Lesson {w.lessonNumber}
                    </Link>
                  )}
                </span>
              </div>
            ))
          )}
        </Card>
      </div>
    </PageMain>
  )
}
