"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, ChoiceChip, Eyebrow, PageHeading } from "@/components/shared/primitives"
import { newPathAnswersSchema, weeklyHoursFrom, type NewPathAnswers } from "@/lib/validations/paths"
import { cn } from "@/lib/utils"

const STEP_NAMES = ["Jobs and titles", "Starting point", "Market and interviews", "Proof", "Time", "How you learn", "Worries"]
const QUESTIONS = STEP_NAMES.length

const TITLES = ["Full Stack Engineer", "Senior Frontend Engineer", "Product Engineer", "Backend Engineer (Node)", "Software Engineer II", "AI Product Engineer", "Tech Lead (frontend)"]
const MARKETS = ["Established local companies", "International remote teams", "Both"]
const ROUNDS = ["DSA with a timer", "JavaScript and React depth", "System design", "Take-home project", "CV deep-dive", "Live pairing"]
const PROOFS: [string, string][] = [
  ["A shipped project", "Live, with a repo and a URL an interviewer can open."],
  ["Passing a mock interview", "Scored 3 or better on every item in a mock."],
  ["A write-up I can show", "A design doc or postmortem in my own words."],
  ["A habit that sticks", "Four things a day for 60 days."],
]
const WEEKDAY: [string, number][] = [["20 min", 20], ["30 min", 30], ["45 min", 45], ["60 min", 60], ["90 min", 90], ["2 h", 120]]
const WEEKEND: [string, number][] = [["0 h", 0], ["1 h", 1], ["2 h", 2], ["3 h", 3], ["4 h+", 4]]
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const
const STYLES = ["Build first, read when stuck", "Read first, then build", "Mixed"]
const AI_RULES = ["Off during problems and drills", "Hints only after I'm stuck 15 min", "Allowed, I'll be honest"]
const WORRIES = ["DSA under a timer", "JavaScript internals", "System design", "SQL and databases", "Talking about my own CV", "Interviewing in English", "Take-homes I never finish"]

const STORAGE_KEY = "manzil-new-path-answers"

const textarea =
  "box-border w-full resize-y rounded-lg border border-input bg-card px-3.5 py-3 text-base text-foreground placeholder:text-muted-foreground"

function defaultMonth() {
  const d = new Date()
  d.setMonth(d.getMonth() + 5)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

type Profile = { roleToday: string; years: number; confident: string; goal: string; dailyHours: number }

function initialAnswers(p: Profile): NewPathAnswers {
  const minutes = Math.round(Math.min(120, Math.max(20, p.dailyHours * 60)) / 15) * 15
  return {
    titles: [],
    otherTitle: p.goal,
    jobPosts: "",
    roleToday: p.roleToday,
    years: p.years,
    confident: p.confident,
    touched: "",
    skip: "",
    market: "Both",
    rounds: [],
    startMonth: defaultMonth(),
    proofs: ["A shipped project"],
    project: "",
    weekdayMinutes: minutes,
    weekendHours: 2,
    daysOff: [],
    style: "Mixed",
    ai: "Off during problems and drills",
    language: "",
    worries: [],
    badInterview: "",
  }
}

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
        Question {n} of {QUESTIONS}
      </Eyebrow>
      <PageHeading>{title}</PageHeading>
      <p className="m-0 text-muted-foreground">{sub}</p>
    </div>
  )
}

export function NewPathWizard({ profile }: { profile: Profile }) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [a, setA] = useState<NewPathAnswers>(() => initialAnswers(profile))
  const [error, setError] = useState("")
  const [drawing, setDrawing] = useState(false)

  // "Change my answers" on a draft brings the previous answers back.
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY)
      if (saved) {
        sessionStorage.removeItem(STORAGE_KEY)
        const parsed = newPathAnswersSchema.safeParse(JSON.parse(saved))
        if (parsed.success) setA(parsed.data) // eslint-disable-line react-hooks/set-state-in-effect
      }
    } catch {}
  }, [])

  const set = <K extends keyof NewPathAnswers>(k: K, v: NewPathAnswers[K]) => setA((s) => ({ ...s, [k]: v }))
  const toggleIn = (k: "titles" | "rounds" | "proofs" | "worries", v: string) =>
    setA((s) => ({ ...s, [k]: s[k].includes(v) ? s[k].filter((x) => x !== v) : [...s[k], v] }))

  const chips = (options: string[], selected: (o: string) => boolean, onPick: (o: string) => void, label: string) => (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => (
        <ChoiceChip key={o} selected={selected(o)} onClick={() => onPick(o)}>
          {o}
        </ChoiceChip>
      ))}
    </div>
  )

  const weekly = weeklyHoursFrom(a)

  function canLeave(i: number) {
    if (i === 0 && a.titles.length === 0 && !a.otherTitle.trim()) return "Pick at least one title, or type your own."
    return ""
  }

  function next() {
    const problem = canLeave(step)
    if (problem) return setError(problem)
    setError("")
    if (step < QUESTIONS - 1) setStep(step + 1)
    else void draw()
  }

  async function draw() {
    const answers = { ...a, titles: a.titles.length ? a.titles : [a.otherTitle.trim()] }
    const parsed = newPathAnswersSchema.safeParse(answers)
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? "Check your answers.")
    setDrawing(true)
    setError("")
    try {
      const res = await fetch("/api/ai/path-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      })
      const body = await res.json().catch(() => null)
      if (!res.ok || !body?.id) {
        setError(body?.error ?? "Couldn't draw the path. Try again.")
        setDrawing(false)
        return
      }
      router.push(`/paths/new?draft=${body.id}`)
    } catch {
      setError("You seem to be offline. Your answers are still here; try again.")
      setDrawing(false)
    }
  }

  return (
    <main className="mx-auto box-border flex w-full max-w-[1100px] flex-1 flex-col gap-[18px] px-4 pt-4 pb-6 md:flex-row md:flex-wrap md:items-start md:gap-7 md:px-6 md:pt-7 md:pb-18">
      <aside className="hidden max-w-[280px] flex-[1_1_240px] flex-col gap-0.5 md:flex">
        <Eyebrow className="px-3 pb-2">New path · {QUESTIONS} questions</Eyebrow>
        {STEP_NAMES.map((name, k) => {
          const cur = k === step
          const past = k < step
          return (
            <button
              key={name}
              type="button"
              onClick={() => !drawing && setStep(k)}
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
                {k + 1}
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
              {chips(TITLES, (o) => a.titles.includes(o), (o) => toggleIn("titles", o), "Titles")}
              <Field id="t-own" label="Another title">
                <Input id="t-own" value={a.otherTitle} onChange={(e) => set("otherTitle", e.target.value)} placeholder="Product Engineer (frontend-leaning)" />
              </Field>
              <Field id="t-posts" label="Paste one to three job posts you'd love to get" hint="(optional, the single best input)">
                <textarea
                  id="t-posts"
                  rows={5}
                  className={textarea}
                  value={a.jobPosts}
                  onChange={(e) => set("jobPosts", e.target.value)}
                  placeholder="Paste the full text of a posting. Requirements, nice-to-haves, the interview process if they mention it."
                />
              </Field>
            </Card>
          </>
        )}

        {step === 1 && (
          <>
            <QuestionHead n={2} title="Where are you starting from?" sub="Prefilled from your profile. The more honest this is, the less the path wastes." />
            <Card className="gap-4 p-[18px] md:p-6">
              <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
                <Field id="role" label="Role today">
                  <Input id="role" value={a.roleToday} onChange={(e) => set("roleToday", e.target.value)} />
                </Field>
                <Field id="years" label="Years of professional work">
                  <Input id="years" type="number" min={0} max={60} value={a.years} onChange={(e) => set("years", Number(e.target.value))} />
                </Field>
              </div>
              <Field id="stack" label="Confident with, at work or in a shipped project">
                <Input id="stack" value={a.confident} onChange={(e) => set("confident", e.target.value)} />
              </Field>
              <Field id="touched" label="Touched but not confident">
                <Input id="touched" value={a.touched} onChange={(e) => set("touched", e.target.value)} placeholder="NestJS, Prisma, Docker" />
              </Field>
              <Field id="skip" label="Skip entirely, I know it well">
                <Input id="skip" value={a.skip} onChange={(e) => set("skip", e.target.value)} placeholder="React hooks, CSS layout, Git basics" />
              </Field>
            </Card>
          </>
        )}

        {step === 2 && (
          <>
            <QuestionHead n={3} title="Which market, and what kind of interviews?" sub="This decides how much of the path is interview practice and which kind." />
            <Card className="gap-[18px] p-[18px] md:p-6">
              <div className="flex flex-col gap-2">
                <span className="text-sm font-semibold">Market</span>
                {chips(MARKETS, (o) => a.market === o, (o) => set("market", o), "Market")}
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-sm font-semibold">
                  Interview rounds you expect <span className="font-normal text-muted-foreground">(pick all that apply)</span>
                </span>
                {chips(ROUNDS, (o) => a.rounds.includes(o), (o) => toggleIn("rounds", o), "Interview rounds")}
              </div>
              <Field id="when" label="When do you want to start interviewing?">
                <Input id="when" type="month" value={a.startMonth} onChange={(e) => set("startMonth", e.target.value)} className="max-w-60" />
              </Field>
            </Card>
          </>
        )}

        {step === 3 && (
          <>
            <QuestionHead n={4} title="What will prove you got there?" sub="Every milestone ends with a proof step. Pick the kind of proof an interviewer would believe." />
            <Card className="gap-3.5 p-[18px] md:p-6">
              <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
                {PROOFS.map(([label, meta]) => {
                  const on = a.proofs.includes(label)
                  return (
                    <button
                      key={label}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggleIn("proofs", label)}
                      className={cn(
                        "flex min-h-11 cursor-pointer flex-col gap-1 rounded-lg border-2 p-4 text-left text-foreground",
                        on ? "border-fill bg-muted" : "border-border bg-card hover:bg-muted"
                      )}
                    >
                      <span className="font-semibold">{label}</span>
                      <span className="text-[13px] text-muted-foreground">{meta}</span>
                    </button>
                  )
                })}
              </div>
              <Field id="project" label="A project you'd like this path to build or finish" hint="(optional)">
                <Input id="project" value={a.project} onChange={(e) => set("project", e.target.value)} placeholder="Name: stack, e.g. Manzil: Next.js, Prisma, PostgreSQL" />
              </Field>
            </Card>
          </>
        )}

        {step === 4 && (
          <>
            <QuestionHead n={5} title="How much time, really?" sub="Pick the numbers you'd keep on a bad week. The plan date comes from these." />
            <Card className="gap-[18px] p-[18px] md:p-6">
              <div className="flex flex-col gap-2">
                <span className="text-sm font-semibold">On a weekday</span>
                {chips(WEEKDAY.map((w) => w[0]), (o) => WEEKDAY.find((w) => w[0] === o)![1] === a.weekdayMinutes, (o) => set("weekdayMinutes", WEEKDAY.find((w) => w[0] === o)![1]), "On a weekday")}
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-sm font-semibold">On a weekend day</span>
                {chips(WEEKEND.map((w) => w[0]), (o) => WEEKEND.find((w) => w[0] === o)![1] === a.weekendHours, (o) => set("weekendHours", WEEKEND.find((w) => w[0] === o)![1]), "On a weekend day")}
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-sm font-semibold">Days you can&apos;t work on this</span>
                <div role="group" aria-label="Days off" className="flex flex-wrap gap-2">
                  {DAYS.map((d) => (
                    <ChoiceChip
                      key={d}
                      selected={a.daysOff.includes(d)}
                      className="min-w-11 px-3"
                      onClick={() => set("daysOff", a.daysOff.includes(d) ? a.daysOff.filter((x) => x !== d) : [...a.daysOff, d])}
                    >
                      {d}
                    </ChoiceChip>
                  ))}
                </div>
              </div>
              <p role="status" className="m-0 rounded-lg bg-muted px-3.5 py-3 text-sm text-body">
                About {Math.round(weekly * 10) / 10} hours a week.{" "}
                {weekly < 2 ? "That's very little; the path will be long. Even 30 minutes on weekdays changes a lot." : "The draft is sized to fit this."}
              </p>
            </Card>
          </>
        )}

        {step === 5 && (
          <>
            <QuestionHead n={6} title="How do you learn best?" sub="This sets the mix of learn, build and prove steps, and the rules on AI while you practise." />
            <Card className="gap-[18px] p-[18px] md:p-6">
              <div className="flex flex-col gap-2">
                <span className="text-sm font-semibold">Style</span>
                {chips(STYLES, (o) => a.style === o, (o) => set("style", o), "Style")}
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-sm font-semibold">AI while practising</span>
                {chips(AI_RULES, (o) => a.ai === o, (o) => set("ai", o), "AI while practising")}
                <span className="text-[13px] text-muted-foreground">Drawing the path, splitting steps and the weekly read always use AI, and say so.</span>
              </div>
              <Field id="lang" label="Interview language, if not English">
                <Input id="lang" value={a.language} onChange={(e) => set("language", e.target.value)} placeholder="English" className="max-w-80" />
              </Field>
            </Card>
          </>
        )}

        {step === 6 && (
          <>
            <QuestionHead n={7} title="What worries you most about the interviews?" sub="Be blunt. Worries get more drills and earlier practice; nothing here is judged." />
            <Card className="gap-3.5 p-[18px] md:p-6">
              {chips(WORRIES, (o) => a.worries.includes(o), (o) => toggleIn("worries", o), "Worries")}
              <Field id="story" label="The last interview that went badly: what happened?" hint="(optional)">
                <textarea
                  id="story"
                  rows={3}
                  className={textarea}
                  value={a.badInterview}
                  onChange={(e) => set("badInterview", e.target.value)}
                  placeholder="They asked me to explain the event loop and I froze."
                />
              </Field>
            </Card>
          </>
        )}

        {error && (
          <p role="alert" className="m-0 rounded-lg bg-accent px-4 py-3 text-sm">
            {error}
          </p>
        )}

        {drawing ? (
          <p role="status" className="m-0 rounded-lg bg-muted px-4 py-3.5 text-sm text-body">
            Drawing your path. This takes up to a minute: Claude is sizing every step to your week.
          </p>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button variant="ghost" className="px-3.5" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
              ← Back
            </Button>
            <div className="flex items-center gap-3">
              {step > 0 && <span className="text-[13px] text-muted-foreground">Optional fields can stay empty.</span>}
              <Button size="lg" onClick={next}>
                {step === QUESTIONS - 1 ? "Draw my path" : "Next"}
              </Button>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}
