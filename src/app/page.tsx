import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { PublicHeader } from "@/components/layout/public-header"
import { Card, Eyebrow, Meter } from "@/components/shared/primitives"
import { Trail } from "@/components/shared/trail"
import type { TrailNode } from "@/components/shared/trail"

// Illustration only: an example path and score on the signed-out home page.
const EXAMPLE_PATH = { title: "Senior Full Stack: Next.js + NestJS + PostgreSQL", planAt: 0.42 }
const EXAMPLE_STOPS: TrailNode[] = [
  { label: "NestJS foundations", state: "done" },
  { label: "PostgreSQL and Prisma", state: "here" },
  { label: "Auth and security", state: "ahead" },
  { label: "Docker and AWS", state: "ahead" },
  { label: "Full Stack Engineer", state: "ahead" },
]
const EXAMPLE_READINESS = {
  score: 41,
  band: "Building",
  parts: [
    { name: "Problem solving", score: 14, max: 35 },
    { name: "Concepts", score: 18, max: 35 },
    { name: "Mock interviews", score: 0, max: 20 },
    { name: "Consistency", score: 9, max: 10 },
  ],
}

const FOUR = [
  { eyebrow: "Read · 5 min", title: "One lesson", body: "A plain-words lesson from a 240-day course, built on what you read yesterday." },
  { eyebrow: "Solve · 30 min", title: "One problem", body: "One interview problem, AI off, with a timer. What you couldn't solve comes back on Sunday." },
  { eyebrow: "Drill · 15 min", title: "One concept", body: "One question, answered out loud with no notes. You score yourself; weak topics return sooner." },
  { eyebrow: "Build · 60 min", title: "One step", body: "The next step on your path, with sub-tasks, a resource, and what done looks like." },
]

const HONEST = [
  { title: "Missed days don't punish you", body: "Unfinished steps move forward and the plan date recomputes. You get one calm sentence, not a broken streak." },
  { title: "AI off while you practise", body: "Problems and drills are done without assistants, because interviews are. AI draws the path and writes the honest weekly read, and says so." },
  { title: "Self-scored, labelled as such", body: "Your readiness score is yours. It can go down when a topic comes back and you score it lower. That is the system working." },
]

const h2 = "m-0 font-heading text-[32px] leading-[1.15] font-bold"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <PublicHeader />
      <main className="flex w-full flex-1 flex-col">
        <section className="bg-hero px-4 pt-10 pb-12 text-hero-foreground md:px-8 md:pt-18 md:pb-16">
          <div className="mx-auto flex max-w-[1100px] flex-col gap-7">
            <div className="flex max-w-[760px] flex-col gap-4">
              <Eyebrow className="text-hero-soft">Manzil means destination</Eyebrow>
              <h1 className="m-0 font-heading text-[34px] leading-[1.08] font-bold tracking-[-0.01em] md:text-[52px]">
                Know exactly what to do today to reach the job you want.
              </h1>
              <p className="m-0 max-w-[58ch] text-[19px] text-hero-muted">
                Name the role. Manzil draws the path in small steps, hands you four things a day, and tells you plainly
                whether you are on pace and ready to interview.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Link href="/signup" className={buttonVariants({ size: "xl" })}>
                  Create your manzil
                </Link>
                <Link
                  href="/login"
                  className="inline-flex min-h-13 items-center px-5 font-semibold text-hero-foreground underline"
                >
                  I already have one
                </Link>
              </div>
            </div>
            <div className="flex flex-col gap-3.5 rounded-card bg-hero-panel px-7 pt-6 pb-5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1.5">
                <span className="font-heading text-[17px] font-bold">{EXAMPLE_PATH.title}</span>
                <span className="text-[13px] text-hero-muted">an example path</span>
              </div>
              <Trail nodes={EXAMPLE_STOPS} plan={EXAMPLE_PATH.planAt} onHero />
              <p className="m-0 text-sm text-hero-muted">
                Solid is walked. Dashed is ahead. The tick is where the plan says you should be. The orange pin is you.
                The gap between them is the only number that matters.
              </p>
            </div>
          </div>
        </section>

        <section id="how" className="px-4 py-16 md:px-8">
          <div className="mx-auto flex max-w-[1100px] flex-col gap-7">
            <div className="flex max-w-[640px] flex-col gap-2">
              <Eyebrow>Four things a day</Eyebrow>
              <h2 className={h2}>About two hours. Then stop.</h2>
              <p className="m-0 text-muted-foreground">
                Every day has the same shape, so you never decide what to study. You just start.
              </p>
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(240px,100%),1fr))] gap-4">
              {FOUR.map((f) => (
                <Card as="div" key={f.title} className="gap-2 p-[22px]">
                  <Eyebrow className="text-link">{f.eyebrow}</Eyebrow>
                  <span className="font-heading text-xl font-bold">{f.title}</span>
                  <span className="text-[15px] text-muted-foreground">{f.body}</span>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 pb-16 md:px-8">
          <div className="mx-auto flex max-w-[1100px] flex-wrap items-center gap-7">
            <div className="flex flex-[1_1_320px] flex-col gap-2.5">
              <Eyebrow>Interview-ready, measured</Eyebrow>
              <h2 className={h2}>One number, four honest parts.</h2>
              <p className="m-0 text-muted-foreground">
                Problem solving, concepts, mock interviews and consistency. Self-scored, so it is a compass. Mocks and
                real interviews are the proof.
              </p>
            </div>
            <Card as="div" className="flex-[999_1_420px] gap-3.5 px-7 py-6">
              <div className="flex items-baseline gap-3">
                <span className="font-heading text-[44px] leading-none font-bold">{EXAMPLE_READINESS.score}</span>
                <span className="text-muted-foreground">out of 100 · {EXAMPLE_READINESS.band}</span>
              </div>
              {EXAMPLE_READINESS.parts.map((p) => (
                <div key={p.name} className="flex flex-col gap-[5px]">
                  <div className="flex justify-between gap-2 text-sm">
                    <span className="font-semibold">{p.name}</span>
                    <span className="text-muted-foreground">
                      {p.score} of {p.max}
                    </span>
                  </div>
                  <Meter pct={Math.round((p.score / p.max) * 100)} />
                </div>
              ))}
            </Card>
          </div>
        </section>

        <section id="honest" className="border-y border-border bg-card px-4 py-16 md:px-8">
          <div className="mx-auto flex max-w-[1100px] flex-col gap-6">
            <div className="flex max-w-[640px] flex-col gap-2">
              <Eyebrow>Why it&apos;s honest</Eyebrow>
              <h2 className={h2}>No streaks to protect. No AI doing your reps.</h2>
            </div>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(280px,100%),1fr))] gap-4">
              {HONEST.map((h) => (
                <div key={h.title} className="flex flex-col gap-1.5 rounded-lg bg-muted p-5">
                  <span className="font-bold">{h.title}</span>
                  <span className="text-[15px] text-body">{h.body}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-16 md:px-8">
          <div className="mx-auto flex max-w-[1100px] flex-wrap items-center justify-between gap-4">
            <h2 className="m-0 max-w-[24ch] font-heading text-[28px] leading-[1.15] font-bold">
              Name your destination. The first day is ready in a minute.
            </h2>
            <Link href="/signup" className={buttonVariants({ size: "xl" })}>
              Create your manzil
            </Link>
          </div>
        </section>

        <footer className="flex flex-wrap justify-between gap-x-6 gap-y-2 px-4 pt-6 pb-10 text-sm text-muted-foreground md:px-8">
          <span>Manzil · built in Lahore</span>
        </footer>
      </main>
    </div>
  )
}
