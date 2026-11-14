"use client"

import { useEffect, useState, useTransition } from "react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, Eyebrow } from "@/components/shared/primitives"
import { logProblemAttempt } from "@/actions/practice"
import { cn } from "@/lib/utils"

const LIMIT = 30 * 60

type Phase = "idle" | "running" | "stopped" | "done"
type Outcome = "SOLVED" | "HINT" | "FAILED"

const OUTCOMES: { value: Outcome; label: string }[] = [
  { value: "SOLVED", label: "Solved it alone" },
  { value: "HINT", label: "Needed a hint" },
  { value: "FAILED", label: "Couldn't solve it" },
]

const RESULT: Record<Outcome, (min: number) => [string, string]> = {
  SOLVED: (m) => [`Logged: solved alone, ${m} ${m === 1 ? "minute" : "minutes"}.`, "That's today's one. Tomorrow brings the next problem."],
  HINT: () => ["Logged: needed a hint.", "Counts as half. Read the editorial's pattern once, then stop."],
  FAILED: () => [
    "Logged: couldn't solve it. That's a normal result.",
    "Read the solution now and name the pattern in one sentence. It comes back next Sunday as your redo; today still counts.",
  ],
}

function mmss(sec: number) {
  return `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`
}

type Props = {
  problem: { id: string; order: number; title: string; url: string; pattern: string; difficulty: string } | null
  total: number
  isRedo: boolean
  redoOfLogId: string | null
  loggedToday: { outcome: Outcome | null; minutes: number | null } | null
}

export function SolveCard({ problem, total, isRedo, redoOfLogId, loggedToday }: Props) {
  const [phase, setPhase] = useState<Phase>(loggedToday ? "done" : "idle")
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const [outcome, setOutcome] = useState<Outcome | null>(loggedToday?.outcome ?? null)
  const [minutes, setMinutes] = useState(loggedToday?.minutes ?? 0)
  const [pending, start] = useTransition()
  const [error, setError] = useState("")

  const left = startedAt ? Math.max(0, LIMIT - Math.floor((now - startedAt) / 1000)) : LIMIT

  useEffect(() => {
    if (phase !== "running") return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [phase])

  useEffect(() => {
    if (phase === "running" && left === 0) setPhase("stopped") // eslint-disable-line react-hooks/set-state-in-effect
  }, [phase, left])

  if (!problem) {
    return (
      <Card className="gap-3 p-[18px] md:p-7">
        <Eyebrow>Solve</Eyebrow>
        <h2 className="m-0 font-heading text-[26px] font-bold">You&apos;ve attempted every problem in the list.</h2>
        <p className="m-0 text-muted-foreground">Sundays still bring back the ones you couldn&apos;t solve.</p>
      </Card>
    )
  }

  function log(o: Outcome) {
    const used = Math.max(1, Math.round((LIMIT - left) / 60))
    setError("")
    start(async () => {
      const res = await logProblemAttempt({ problemId: problem!.id, outcome: o, minutes: used, redoOfLogId: redoOfLogId ?? undefined })
      if (res.success) {
        setOutcome(o)
        setMinutes(used)
        setPhase("done")
      } else setError("Not saved yet. Check your connection and try again.")
    })
  }

  const result = phase === "done" && outcome ? RESULT[outcome](minutes || 1) : null

  return (
    <Card id="solve" className="scroll-mt-6 gap-3.5 p-[18px] md:p-7">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Eyebrow>
          {isRedo ? "Sunday redo" : `Solve · problem ${problem.order} of ${total}`} · AI off
        </Eyebrow>
        <span role="timer" aria-live="off" className={cn("font-heading text-[22px] font-bold", phase === "running" ? "text-pin" : "text-foreground")}>
          {phase === "idle" || phase === "running" ? mmss(left) : "done"}
        </span>
      </div>
      <h2 className="m-0 font-heading text-[26px] leading-[1.2] font-bold">{problem.title}</h2>
      <p className="m-0 text-muted-foreground">
        {problem.pattern} · {problem.difficulty.toLowerCase()}. Say your approach out loud before you type. Thirty minutes, then
        stop whatever happens.
      </p>

      {phase === "idle" && (
        <div className="mt-auto flex flex-wrap gap-2">
          <Button
            size="lg"
            onClick={() => {
              setStartedAt(Date.now())
              setNow(Date.now())
              setPhase("running")
            }}
          >
            Start the 30-minute timer
          </Button>
          <a href={problem.url} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: "outline", size: "lg" })}>
            Open the problem
          </a>
        </div>
      )}

      {phase === "running" && (
        <div className="mt-auto flex flex-wrap items-center gap-2">
          <Button size="lg" variant="fill" onClick={() => setPhase("stopped")}>
            Stop and log the result
          </Button>
          <a href={problem.url} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-link underline">
            Open the problem
          </a>
        </div>
      )}

      {phase === "stopped" && (
        <>
          <p className="m-0 font-semibold">How did it go?</p>
          <div className="flex flex-wrap gap-2">
            {OUTCOMES.map((o) => (
              <Button key={o.value} size="lg" variant="outline" disabled={pending} onClick={() => log(o.value)}>
                {o.label}
              </Button>
            ))}
          </div>
        </>
      )}

      {error && (
        <p role="alert" className="m-0 text-sm text-destructive">
          {error}
        </p>
      )}

      {result && (
        <div role="status" className="flex flex-col gap-1.5 rounded-lg bg-muted px-4 py-3.5">
          <span className="font-semibold">{result[0]}</span>
          <span className="text-sm text-body">{result[1]}</span>
        </div>
      )}
    </Card>
  )
}
