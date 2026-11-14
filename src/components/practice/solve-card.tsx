"use client"

import { useEffect, useState } from "react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, Eyebrow } from "@/components/shared/primitives"
import { PROBLEM } from "@/lib/sample-data"
import { cn } from "@/lib/utils"

const LIMIT = 30 * 60

type Phase = "idle" | "running" | "stopped" | "done"
type Outcome = "solved" | "hint" | "failed"

const OUTCOMES: { value: Outcome; label: string }[] = [
  { value: "solved", label: "Solved it alone" },
  { value: "hint", label: "Needed a hint" },
  { value: "failed", label: "Couldn't solve it" },
]

function mmss(sec: number) {
  return `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`
}

export function SolveCard() {
  const [phase, setPhase] = useState<Phase>("idle")
  const [left, setLeft] = useState(LIMIT)
  const [outcome, setOutcome] = useState<Outcome | null>(null)

  useEffect(() => {
    if (phase !== "running") return
    const id = setInterval(() => {
      setLeft((l) => {
        if (l <= 1) {
          setPhase("stopped")
          return 0
        }
        return l - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [phase])

  const usedMin = Math.max(1, Math.round((LIMIT - left) / 60))
  const result =
    outcome === "solved"
      ? [`Logged: solved alone, ${usedMin} minutes.`, `That's today's one. Tomorrow: ${PROBLEM.next}.`]
      : outcome === "hint"
        ? ["Logged: needed a hint.", `Counts as half. Read the editorial's pattern once, then stop. Tomorrow: ${PROBLEM.next}.`]
        : outcome === "failed"
          ? [
              "Logged: couldn't solve it. That's a normal result.",
              "Read the solution now and name the pattern in one sentence. It comes back next Sunday as your redo; today still counts.",
            ]
          : null

  return (
    <Card className="gap-3.5 p-[18px] md:p-7">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Eyebrow>
          Solve · problem {PROBLEM.number} of {PROBLEM.total} · AI off
        </Eyebrow>
        <span
          role="timer"
          aria-live="off"
          className={cn("font-heading text-[22px] font-bold", phase === "running" ? "text-pin" : "text-foreground")}
        >
          {phase === "idle" || phase === "running" ? mmss(left) : "done"}
        </span>
      </div>
      <h2 className="m-0 font-heading text-[26px] leading-[1.2] font-bold">{PROBLEM.title}</h2>
      <p className="m-0 text-muted-foreground">
        {PROBLEM.source}. Say your approach out loud before you type. Thirty minutes, then stop whatever happens.
      </p>

      {phase === "idle" && (
        <div className="mt-auto flex flex-wrap gap-2">
          <Button size="lg" onClick={() => setPhase("running")}>
            Start the 30-minute timer
          </Button>
          <a
            href={PROBLEM.url}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            Open the problem
          </a>
        </div>
      )}

      {phase === "running" && (
        <div className="mt-auto flex flex-wrap items-center gap-2">
          <Button size="lg" variant="fill" onClick={() => setPhase("stopped")}>
            Stop and log the result
          </Button>
          <span className="text-sm text-muted-foreground">Timer running. Go solve it.</span>
        </div>
      )}

      {phase === "stopped" && (
        <>
          <p className="m-0 font-semibold">How did it go?</p>
          <div className="flex flex-wrap gap-2">
            {OUTCOMES.map((o) => (
              <Button
                key={o.value}
                size="lg"
                variant="outline"
                onClick={() => {
                  setOutcome(o.value)
                  setPhase("done")
                }}
              >
                {o.label}
              </Button>
            ))}
          </div>
        </>
      )}

      {phase === "done" && result && (
        <div role="status" className="flex flex-col gap-1.5 rounded-lg bg-muted px-4 py-3.5">
          <span className="font-semibold">{result[0]}</span>
          <span className="text-sm text-body">{result[1]}</span>
        </div>
      )}
    </Card>
  )
}
