"use client"

import { useState } from "react"
import Link from "next/link"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, ChoiceChip, Eyebrow, PageHeading } from "@/components/shared/primitives"
import { Trail, type TrailNode } from "@/components/shared/trail"
import { cn } from "@/lib/utils"

const STEP_NAMES = [
  "Jobs and titles",
  "Starting point",
  "Market and interviews",
  "Proof",
  "Time",
  "How you learn",
  "Worries",
  "Your draft",
]
const LAST = STEP_NAMES.length - 1

const OPTIONS = {
  titles: ["Full Stack Engineer", "Senior Frontend Engineer", "Product Engineer", "Backend Engineer (Node)", "Software Engineer II", "AI Product Engineer", "Tech Lead (frontend)"],
  markets: ["Established companies in Lahore", "International remote teams", "Both"],
  rounds: ["DSA with a timer", "JavaScript and React depth", "System design", "Take-home project", "CV deep-dive", "Live pairing"],
  proofs: ["A shipped project", "Passing a mock interview", "A write-up I can show", "A habit that sticks"],
  weekday: ["20 min", "30 min", "45 min", "60 min", "90 min"],
  weekend: ["1 h", "2 h", "3 h", "4 h+"],
  off: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  styles: ["Build first, read when stuck", "Read first, then build", "Mixed"],
  ai: ["Off during problems and drills", "Hints only after I'm stuck 15 min", "Allowed, I'll be honest"],
  fears: ["DSA under a timer", "JavaScript internals", "System design", "SQL and databases", "Talking about my own CV", "Interviewing in English", "Take-homes I never finish"],
} as const

const PROOF_META = [
  "Live, with a repo and a URL an interviewer can open.",
  "Scored 3 or better on every item in a Manzil mock.",
  "A design doc or postmortem in my own words.",
  "Four things a day for 60 days.",
]

const WEEKDAY_HOURS = [1 / 3, 0.5, 0.75, 1, 1.5]
const WEEKEND_HOURS = [1, 2, 3, 4]
const PATH_HOURS = 110

type Group = keyof typeof OPTIONS
type Selection = Record<Group, number[]>
const SINGLE: Group[] = ["markets", "weekday", "weekend", "styles", "ai"]

const DRAFT = [
  { title: "Backend you can defend", meta: "4 weeks · 18 h", why: "NestJS, DTOs, guards, tests. Skips React, which you know." },
  { title: "PostgreSQL and Prisma", meta: "4 weeks · 18 h", why: "Schema, migrations, indexes, EXPLAIN. Builds Manzil's real tables." },
  { title: "Auth and security", meta: "3 weeks · 14 h", why: "Moved earlier: you named it as a worry and most Lahore rounds ask it." },
  { title: "Docker, CI and AWS", meta: "4 weeks · 20 h", why: "Ship Manzil on EC2 with CI. The proof is a deploy from a clean clone." },
  { title: "System design and mocks", meta: "5 weeks · 24 h", why: "A design framework, caching, queues; then four mocks in your market's format." },
  { title: "Interview sprint", meta: "4 weeks · 18 h", why: "Daily problems stay; drills double; your CV stories get rehearsed with real postings." },
]
const DRAFT_STOPS: TrailNode[] = [
  { label: "Start", state: "here" },
  { label: "Backend", state: "ahead" },
  { label: "Data", state: "ahead" },
  { label: "Auth", state: "ahead" },
  { label: "Ship", state: "ahead" },
  { label: "Design", state: "ahead" },
  { label: "Full Stack Engineer", state: "ahead" },
]

const textarea =
  "box-border w-full resize-y rounded-lg border border-input bg-card px-3.5 py-3 text-base text-foreground placeholder:text-muted-foreground"

function Field({ id, label, hint, children }: { id: string; label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="block leading-normal">
        {label} {hint && <span className="font-normal text-muted-foreground">{hint}</span>}
      </Label>
      {children}
    </div>
  )
}

function QuestionHead({ n, title, sub }: { n: number; title: string; sub: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Eyebrow>
        Question {n} of {LAST}
      </Eyebrow>
      <PageHeading>{title}</PageHeading>
      <p className="m-0 text-muted-foreground">{sub}</p>
    </div>
  )
}

export function NewPathWizard({ initialStep = 0 }: { initialStep?: number }) {
  const [step, setStep] = useState(initialStep)
  const [sel, setSel] = useState<Selection>({
    titles: [0, 1],
    markets: [2],
    rounds: [0, 1, 3],
    proofs: [0],
    weekday: [2],
    weekend: [2],
    off: [],
    styles: [2],
    ai: [0],
    fears: [0, 1, 4],
  })

  function toggle(g: Group, k: number) {
    setSel((s) => {
      if (SINGLE.includes(g)) return { ...s, [g]: [k] }
      const has = s[g].includes(k)
      return { ...s, [g]: has ? s[g].filter((x) => x !== k) : [...s[g], k] }
    })
  }

  function chips(g: Group, label?: string) {
    return (
      <div role="group" aria-label={label} className="flex flex-wrap gap-2">
        {OPTIONS[g].map((opt, k) => (
          <ChoiceChip
            key={opt}
            selected={sel[g].includes(k)}
            onClick={() => toggle(g, k)}
            className={g === "off" ? "min-w-11 px-3" : undefined}
          >
            {opt}
          </ChoiceChip>
        ))}
      </div>
    )
  }

  const weeklyH =
    WEEKDAY_HOURS[sel.weekday[0] ?? 2] * Math.max(0, 5 - sel.off.filter((d) => d < 5).length) +
    WEEKEND_HOURS[sel.weekend[0] ?? 2] * Math.max(0, 2 - sel.off.filter((d) => d >= 5).length)
  const timeLine = `About ${Math.round(weeklyH * 10) / 10} hours a week. A ${PATH_HOURS}-hour path lands in about ${Math.ceil(
    PATH_HOURS / Math.max(1, weeklyH)
  )} weeks at that pace.`

  return (
    <main className="mx-auto box-border flex w-full max-w-[1100px] flex-1 flex-col gap-[18px] px-4 pt-4 pb-6 md:flex-row md:flex-wrap md:items-start md:gap-7 md:px-6 md:pt-7 md:pb-18">
      <aside className="hidden max-w-[280px] flex-[1_1_240px] flex-col gap-0.5 md:flex">
        <Eyebrow className="px-3 pb-2">New path · {LAST} questions</Eyebrow>
        {STEP_NAMES.map((name, k) => {
          const cur = k === step
          const past = k < step
          return (
            <button
              key={name}
              type="button"
              onClick={() => setStep(k)}
              aria-current={cur ? "step" : undefined}
              className={cn(
                "flex min-h-11 cursor-pointer items-center gap-2.5 rounded-lg border-0 px-3 text-left text-sm font-semibold",
                cur ? "bg-fill text-fill-foreground" : past ? "bg-transparent text-foreground hover:bg-muted" : "bg-transparent text-muted-foreground hover:bg-muted"
              )}
            >
              <span
                className={cn(
                  "grid size-[22px] flex-none place-items-center rounded-full text-[11px]",
                  cur ? "bg-fill-foreground text-fill" : past ? "bg-fill text-fill-foreground" : "bg-muted text-muted-foreground"
                )}
              >
                {k < LAST ? k + 1 : "✓"}
              </span>
              {name}
            </button>
          )
        })}
        <p className="mx-3 mt-3 mb-0 text-[13px] text-muted-foreground">
          Your answers go to Claude with your profile and your current paths. It skips what you already know and never
          invents links.
        </p>
      </aside>

      <section className="flex min-w-0 flex-[999_1_520px] flex-col gap-[18px]">
        <div className="flex gap-1.5" aria-hidden="true">
          {STEP_NAMES.map((name, k) => (
            <span key={name} className={cn("h-1 flex-1 rounded", k <= step ? "bg-fill" : "bg-border")} />
          ))}
        </div>

        {step === 0 && (
          <>
            <QuestionHead
              n={1}
              title="What jobs or titles do you want to hit?"
              sub="Pick any that fit, add your own, and paste real job posts if you have them. The path is built backwards from these."
            />
            <Card className="gap-4 p-[18px] md:p-6">
              {chips("titles", "Titles")}
              <Field id="t-own" label="Another title">
                <Input id="t-own" placeholder="Product Engineer (frontend-leaning)" />
              </Field>
              <Field id="t-posts" label="Paste one to three job posts you'd love to get" hint="(optional, the single best input)">
                <textarea
                  id="t-posts"
                  rows={5}
                  className={textarea}
                  placeholder="Paste the full text of a posting. Requirements, nice-to-haves, the interview process if they mention it."
                />
              </Field>
            </Card>
          </>
        )}

        {step === 1 && (
          <>
            <QuestionHead
              n={2}
              title="Where are you starting from?"
              sub="Prefilled from your profile. The more honest this is, the less the path wastes."
            />
            <Card className="gap-4 p-[18px] md:p-6">
              <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
                <Field id="role" label="Role today">
                  <Input id="role" defaultValue="Software Engineer (React, TypeScript)" />
                </Field>
                <Field id="years" label="Years of professional work">
                  <Input id="years" type="number" min={0} max={40} defaultValue={3} />
                </Field>
              </div>
              <Field id="stack" label="Confident with, at work or in a shipped project">
                <Input id="stack" defaultValue="React, TypeScript, Next.js, GraphQL, Apollo, Angular, PostgreSQL basics" />
              </Field>
              <Field id="touched" label="Touched but not confident">
                <Input id="touched" defaultValue="NestJS, Prisma, Docker, AWS EC2, Redis" />
              </Field>
              <Field id="skip" label="Skip entirely, I know it well">
                <Input id="skip" placeholder="React hooks, CSS layout, Git basics" />
              </Field>
            </Card>
          </>
        )}

        {step === 2 && (
          <>
            <QuestionHead
              n={3}
              title="Which market, and what kind of interviews?"
              sub="This decides how much of the path is interview practice and which kind."
            />
            <Card className="gap-[18px] p-[18px] md:p-6">
              <div className="flex flex-col gap-2">
                <span className="text-sm font-semibold">Market</span>
                {chips("markets", "Market")}
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-sm font-semibold">
                  Interview rounds you expect <span className="font-normal text-muted-foreground">(pick all that apply)</span>
                </span>
                {chips("rounds", "Interview rounds")}
              </div>
              <Field id="when" label="When do you want to start interviewing?">
                <Input id="when" type="month" defaultValue="2027-03" className="max-w-60" />
              </Field>
            </Card>
          </>
        )}

        {step === 3 && (
          <>
            <QuestionHead
              n={4}
              title="What will prove you got there?"
              sub="Every milestone ends with a proof step. Pick the kind of proof an interviewer would believe."
            />
            <Card className="gap-3.5 p-[18px] md:p-6">
              <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
                {OPTIONS.proofs.map((label, k) => {
                  const on = sel.proofs.includes(k)
                  return (
                    <button
                      key={label}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggle("proofs", k)}
                      className={cn(
                        "flex min-h-11 cursor-pointer flex-col gap-1 rounded-lg border-2 p-4 text-left text-foreground",
                        on ? "border-fill bg-muted" : "border-border bg-card hover:bg-muted"
                      )}
                    >
                      <span className="font-semibold">{label}</span>
                      <span className="text-[13px] text-muted-foreground">{PROOF_META[k]}</span>
                    </button>
                  )
                })}
              </div>
              <Field id="project" label="A project you'd like this path to build or finish" hint="(optional)">
                <Input id="project" defaultValue="Manzil: Next.js, Prisma, PostgreSQL, Claude API" />
              </Field>
            </Card>
          </>
        )}

        {step === 4 && (
          <>
            <QuestionHead
              n={5}
              title="How much time, really?"
              sub="Pick the numbers you'd keep on a bad week. The plan date comes from these."
            />
            <Card className="gap-[18px] p-[18px] md:p-6">
              <div className="flex flex-col gap-2">
                <span className="text-sm font-semibold">On a weekday</span>
                {chips("weekday", "On a weekday")}
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-sm font-semibold">On a weekend day</span>
                {chips("weekend", "On a weekend day")}
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-sm font-semibold">Days you can&apos;t work on this</span>
                {chips("off", "Days off")}
              </div>
              <p role="status" className="m-0 rounded-lg bg-muted px-3.5 py-3 text-sm text-body">
                {timeLine}
              </p>
            </Card>
          </>
        )}

        {step === 5 && (
          <>
            <QuestionHead
              n={6}
              title="How do you learn best?"
              sub="This sets the mix of learn, build and prove steps, and the rules on AI while you practise."
            />
            <Card className="gap-[18px] p-[18px] md:p-6">
              <div className="flex flex-col gap-2">
                <span className="text-sm font-semibold">Style</span>
                {chips("styles", "Style")}
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-sm font-semibold">AI while practising</span>
                {chips("ai", "AI while practising")}
                <span className="text-[13px] text-muted-foreground">
                  Drawing the path, splitting steps and the weekly read always use AI, and say so.
                </span>
              </div>
              <Field id="lang" label="Interview language, if not English">
                <Input id="lang" placeholder="English" className="max-w-80" />
              </Field>
            </Card>
          </>
        )}

        {step === 6 && (
          <>
            <QuestionHead
              n={7}
              title="What worries you most about the interviews?"
              sub="Be blunt. Worries get more drills and earlier mocks; nothing here is judged."
            />
            <Card className="gap-3.5 p-[18px] md:p-6">
              {chips("fears", "Worries")}
              <Field id="story" label="The last interview that went badly: what happened?" hint="(optional)">
                <textarea
                  id="story"
                  rows={3}
                  className={textarea}
                  placeholder="They asked me to explain the event loop and I froze."
                />
              </Field>
            </Card>
          </>
        )}

        {step === LAST && (
          <>
            <div className="flex flex-col gap-1.5">
              <Eyebrow>Your draft · 24 weeks · 112 h</Eyebrow>
              <PageHeading>Full Stack Engineer, Lahore and remote</PageHeading>
              <p className="m-0 text-muted-foreground">
                Built backwards from your titles. It skips React fundamentals and CSS, which you know, and puts auth and
                system design earlier because you named them as worries.
              </p>
            </div>
            <Card className="gap-4 p-[18px] md:px-7 md:py-6">
              <Trail nodes={DRAFT_STOPS} />
              {DRAFT.map((m) => (
                <div key={m.title} className="flex flex-col gap-1.5 border-t border-border pt-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <span className="font-bold">{m.title}</span>
                    <span className="text-[13px] text-muted-foreground">{m.meta}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{m.why}</span>
                </div>
              ))}
              <div className="flex flex-wrap items-center gap-3 pt-1.5">
                <Link href="/paths" className={buttonVariants({ size: "lg" })}>
                  Start this path
                </Link>
                <Button size="lg" variant="outline">
                  Edit as text
                </Button>
                <Button size="lg" variant="ghost" className="px-3 text-muted-foreground underline" onClick={() => setStep(0)}>
                  Change my answers
                </Button>
              </div>
            </Card>
          </>
        )}

        {step < LAST && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button
              variant="ghost"
              className="px-3.5"
              disabled={step === 0}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
            >
              ← Back
            </Button>
            <div className="flex items-center gap-3">
              {step > 0 && <span className="text-[13px] text-muted-foreground">Optional fields can stay empty.</span>}
              <Button size="lg" onClick={() => setStep((s) => Math.min(LAST, s + 1))}>
                {step === LAST - 1 ? "Draw my path" : "Next"}
              </Button>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}
