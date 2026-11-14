import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { Card, Eyebrow, Meter, PageHeading, PageMain } from "@/components/shared/primitives"
import { Trail } from "@/components/shared/trail"
import { LAST_28_DAYS, READINESS, READINESS_SCALE, WEEKLY_READ } from "@/lib/sample-data"
import { RefreshReadButton } from "@/components/dashboard/refresh-read-button"
import { cn } from "@/lib/utils"

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const LEVEL = [
  { label: "nothing", bar: "h-2 bg-border" },
  { label: "part of the day", bar: "h-4 bg-off" },
  { label: "all four steps", bar: "h-6 bg-fill" },
]

export default function ProgressPage() {
  const active = LAST_28_DAYS.filter(Boolean).length
  const last14 = LAST_28_DAYS.slice(14).filter(Boolean).length

  return (
    <PageMain>
      <div className="flex flex-col gap-1.5">
        <Eyebrow>Progress</Eyebrow>
        <PageHeading>Are you ready to interview?</PageHeading>
      </div>

      <div className="flex flex-wrap items-start gap-7">
        <Card className="min-w-0 flex-[999_1_560px] gap-[22px] p-[18px] md:px-8 md:py-7">
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
            <span className="font-heading text-[56px] leading-none font-bold">{READINESS.score}</span>
            <span className="text-lg text-muted-foreground">
              out of 100 · <span className="font-semibold text-foreground">{READINESS.band}</span>
            </span>
            <span className="ml-auto text-sm text-muted-foreground">{READINESS.delta}</span>
          </div>
          <Trail nodes={READINESS_SCALE} />
          <p className="m-0 max-w-[70ch] text-sm text-muted-foreground">
            Self-scored, so use it as a compass: mocks and real interviews are the proof. The score can fall when a topic
            you scored well comes back due and you score it lower. That is the system working, not you slipping.
          </p>
          <div className="flex flex-col gap-4 pt-1.5">
            {READINESS.parts.map((p) => (
              <div key={p.name} className="flex flex-col gap-1.5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span>
                    <span className="font-semibold">{p.name}</span>{" "}
                    <span className="text-sm text-muted-foreground">{p.note}</span>
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
            <span className="flex-[999_1_300px]">
              <span className="font-bold">Next best move.</span> Fix your weakest topic first: The event loop, scored 1,
              due tomorrow.
            </span>
            <Link href="/practice" className={cn(buttonVariants(), "flex-none")}>
              Drill it now
            </Link>
          </div>
        </Card>

        <aside className="flex min-w-0 flex-[1_1_340px] flex-col gap-5">
          <section className="flex flex-col gap-3 rounded-card bg-hero p-6 text-hero-foreground">
            <Eyebrow className="text-hero-soft">Honest read of the week</Eyebrow>
            <p className="m-0 font-heading text-lg leading-normal font-medium">{WEEKLY_READ.body}</p>
            <p className="m-0 text-hero-muted">
              <span className="font-semibold text-hero-foreground">One change:</span> {WEEKLY_READ.change}
            </p>
            <p className="m-0 text-[13px] text-ahead">
              Written by AI from your logs on Saturday morning. It can be wrong; your logs are the record.
            </p>
            <RefreshReadButton />
          </section>
        </aside>
      </div>

      <Card className="gap-3.5 px-7 py-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="m-0 font-heading text-[22px] font-bold">Last 4 weeks</h2>
          <span className="text-sm text-muted-foreground">
            {active} active days of 28 · {last14} of the last 14
          </span>
        </div>
        <div className="grid max-w-[560px] grid-cols-7 gap-2">
          {DOW.map((d) => (
            <span key={d} className="text-center text-xs font-semibold text-muted-foreground">
              {d}
            </span>
          ))}
          {LAST_28_DAYS.map((v, i) => {
            const today = i === LAST_28_DAYS.length - 1
            return (
              <span
                key={i}
                role="img"
                aria-label={LEVEL[v].label + (today ? ", today" : "")}
                className="flex h-8 items-end"
              >
                <span
                  className={cn(
                    "box-border block w-full rounded-md border-2",
                    LEVEL[v].bar,
                    today ? "border-pin" : "border-transparent"
                  )}
                />
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
