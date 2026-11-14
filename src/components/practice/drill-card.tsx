"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, Eyebrow } from "@/components/shared/primitives"
import { DRILL } from "@/lib/sample-data"
import { cn } from "@/lib/utils"

const SCORES = [
  { label: "Blank", back: "tomorrow" },
  { label: "Shaky", back: "in 3 days" },
  { label: "Solid", back: "in 7 days" },
  { label: "Could teach", back: "in 14 days" },
]

const VERDICT_NEXT = [
  "Normal for a first pass. Reread Lesson 14 (5 minutes) before it returns.",
  "Say the model answer out loud once now; that is usually enough.",
  "Good. Nothing else to do today.",
  "Good. Nothing else to do today.",
]

export function DrillCard() {
  const [answerShown, setAnswerShown] = useState(false)
  const [picked, setPicked] = useState(0)

  return (
    <Card className="gap-3.5 border-2 border-primary p-[18px] md:p-7">
      <Eyebrow className="text-link">Drill · 15 min · no notes · {DRILL.track}</Eyebrow>
      <h2 className="m-0 font-heading text-[26px] leading-[1.2] font-bold">{DRILL.topic}</h2>
      <p className="m-0">{DRILL.prompt}</p>
      <p className="m-0 text-sm text-muted-foreground">
        Answer out loud, as if to an interviewer. When you&apos;re done, check the model answer and score yourself
        honestly.
      </p>

      {answerShown ? (
        <div className="flex flex-col gap-1.5 rounded-lg bg-muted px-4 py-3.5 text-sm text-body">
          {DRILL.modelAnswer.map((a) => (
            <span key={a.lead}>
              <span className="font-semibold text-foreground">{a.lead}</span> {a.rest}
            </span>
          ))}
        </div>
      ) : (
        <Button variant="outline" className="self-start" onClick={() => setAnswerShown(true)}>
          Show the model answer
        </Button>
      )}

      <div role="group" aria-label="Score yourself" className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {SCORES.map((s, i) => {
          const n = i + 1
          const on = picked === n
          return (
            <button
              key={s.label}
              type="button"
              aria-pressed={on}
              onClick={() => setPicked(n)}
              className={cn(
                "flex min-h-18 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-lg border-2 px-1.5 py-2",
                on ? "border-fill bg-fill text-fill-foreground" : "border-input bg-card text-foreground hover:bg-muted"
              )}
            >
              <span className="font-heading text-xl leading-none font-bold">{n}</span>
              <span className="text-[13px] font-semibold">{s.label}</span>
              <span className="text-xs opacity-80">back {s.back}</span>
            </button>
          )
        })}
      </div>

      {picked > 0 && (
        <div role="status" className="flex flex-col gap-1.5 rounded-lg bg-muted px-4 py-3.5">
          <span className="font-semibold">
            Saved as {picked} · {picked === 4 ? "Could teach it" : SCORES[picked - 1].label}. {DRILL.topic} comes back{" "}
            {SCORES[picked - 1].back}.
          </span>
          <span className="text-sm text-body">{VERDICT_NEXT[picked - 1]}</span>
        </div>
      )}
    </Card>
  )
}
