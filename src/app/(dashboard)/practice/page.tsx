import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardTitle, Eyebrow, PageHeading, PageMain } from "@/components/shared/primitives"
import { Trail } from "@/components/shared/trail"
import { SolveCard } from "@/components/practice/solve-card"
import { DrillCard } from "@/components/practice/drill-card"
import { MOCK_STOPS, TOPIC_TRACKS, WEAK_SPOTS } from "@/lib/sample-data"
import { cn } from "@/lib/utils"

export default function PracticePage() {
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
        <SolveCard />
        <DrillCard />
      </div>

      <Card className="flex-row flex-wrap items-center gap-x-10 gap-y-5 px-7 py-6">
        <div className="flex min-w-0 flex-[999_1_420px] flex-col gap-2">
          <Eyebrow>Mock interview 1 · on-site format</Eyebrow>
          <h2 className="m-0 font-heading text-[22px] font-bold">Unlocks after 3 more drills</h2>
          <p className="m-0 text-sm text-muted-foreground">
            About 90 minutes, best on a weekend. Manzil shows one item at a time with a timer: 2 problems, 4 JavaScript
            and React questions, 3 questions about your own CV. You answer out loud or on paper, then score each item 1
            to 4. Weak items come back as drills. Every fourth mock uses the remote-team format instead.
          </p>
        </div>
        <div className="min-w-0 flex-[1_1_280px]">
          <Trail nodes={MOCK_STOPS} labels={false} />
          <p className="m-0 mt-1.5 text-right text-[13px] text-muted-foreground">2 of 5 drills since your last mock</p>
        </div>
      </Card>

      <div className="flex flex-wrap items-start gap-7">
        <section className="flex min-w-0 flex-[999_1_560px] flex-col gap-3.5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="m-0 font-heading text-[22px] font-bold">Topics</h2>
            <span className="text-sm text-muted-foreground">
              67 topics built around your stack and your CV. Pips: how well you know them.
            </span>
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(260px,100%),1fr))] gap-3">
            {TOPIC_TRACKS.map((t) => (
              <button
                key={t.name}
                type="button"
                className="flex min-h-11 cursor-pointer flex-col gap-2.5 rounded-lg border border-border bg-card p-[18px] text-left text-foreground hover:bg-muted"
              >
                <span className="flex items-baseline justify-between gap-2">
                  <span className="font-semibold">{t.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {t.drilled} of {t.total} drilled
                  </span>
                </span>
                <span role="img" aria-label={`${t.level} of 4`} className="flex gap-1">
                  {[1, 2, 3, 4].map((k) => (
                    <span key={k} className={cn("h-1.5 w-6 rounded-full", k <= t.level ? "bg-fill" : "bg-border")} />
                  ))}
                </span>
              </button>
            ))}
          </div>
        </section>

        <Card as="aside" className="min-w-0 flex-[1_1_320px] gap-1 p-[22px]">
          <CardTitle>Weak spots</CardTitle>
          <p className="mx-0 mt-1 mb-2 text-sm text-muted-foreground">
            Anything you score 1 or 2 stays here until you score it 3 or better. Normal: this is where the learning is.
          </p>
          {WEAK_SPOTS.length === 0 ? (
            <p className="m-0 border-t border-border py-3 text-sm text-muted-foreground">Nothing weak right now.</p>
          ) : (
            WEAK_SPOTS.map((w) => (
              <div key={w.topic} className="flex items-center gap-3 border-t border-border py-3">
                <span className="min-w-0 flex-1">
                  <span className="font-semibold">{w.topic}</span>
                  <br />
                  <span className="text-sm text-muted-foreground">{w.note}</span>
                </span>
                {w.action.kind === "link" ? (
                  <Link href={w.action.href} className="flex-none text-sm font-semibold text-link underline">
                    {w.action.label}
                  </Link>
                ) : (
                  <Button variant="outline" size="sm" className="h-11 flex-none">
                    {w.action.label}
                  </Button>
                )}
              </div>
            ))
          )}
        </Card>
      </div>
    </PageMain>
  )
}
