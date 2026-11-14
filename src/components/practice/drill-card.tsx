"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, Eyebrow } from "@/components/shared/primitives"
import { scoreTopic } from "@/actions/practice"
import { REVIEW_INTERVAL_DAYS } from "@/lib/validations/practice"
import { cn } from "@/lib/utils"

const LABELS = ["Blank", "Shaky", "Solid", "Could teach"]
const back = (i: number) => (REVIEW_INTERVAL_DAYS[i] === 1 ? "tomorrow" : `in ${REVIEW_INTERVAL_DAYS[i]} days`)

type Props = {
  drill: {
    id: string
    track: string
    title: string
    prompt: string
    lessonNumber: number | null
    modelAnswer: { lead: string; rest: string }[] | null
    isNew: boolean
    lastScore: number | null
    scoredToday: number | null
  }
}

export function DrillCard({ drill }: Props) {
  const [answer, setAnswer] = useState(drill.modelAnswer)
  const [shown, setShown] = useState(false)
  const [loading, setLoading] = useState(false)
  const [picked, setPicked] = useState(drill.scoredToday ?? 0)
  const [saved, setSaved] = useState(drill.scoredToday !== null)
  const [pending, start] = useTransition()
  const [error, setError] = useState("")

  async function reveal() {
    setError("")
    if (answer) return setShown(true)
    setLoading(true)
    try {
      const res = await fetch("/api/ai/model-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicId: drill.id }),
      })
      const body = await res.json().catch(() => null)
      if (!res.ok) setError(body?.error ?? "Couldn't load the model answer.")
      else {
        setAnswer(body.points)
        setShown(true)
      }
    } finally {
      setLoading(false)
    }
  }

  function score(n: number) {
    setPicked(n)
    setError("")
    start(async () => {
      const res = await scoreTopic({ topicId: drill.id, score: n })
      if (res.success) setSaved(true)
      else setError("Not saved yet. Check your connection and try again.")
    })
  }

  return (
    <Card id="drill" className="scroll-mt-6 gap-3.5 border-2 border-primary p-[18px] md:p-7">
      <Eyebrow className="text-link">
        Drill · 15 min · no notes · {drill.track} · {drill.isNew ? "new topic" : `last scored ${drill.lastScore}`}
      </Eyebrow>
      <h2 className="m-0 font-heading text-[26px] leading-[1.2] font-bold">{drill.title}</h2>
      <p className="m-0">{drill.prompt}</p>
      <p className="m-0 text-sm text-muted-foreground">
        Answer out loud, as if to an interviewer. When you&apos;re done, check the model answer and score yourself honestly.
      </p>

      {shown && answer ? (
        <div className="flex flex-col gap-1.5 rounded-lg bg-muted px-4 py-3.5 text-sm text-body">
          {answer.map((a) => (
            <span key={a.lead}>
              <span className="font-semibold text-foreground">{a.lead}</span> {a.rest}
            </span>
          ))}
          <span className="pt-1 text-xs text-muted-foreground">Model answer written by AI.</span>
        </div>
      ) : (
        <Button variant="outline" className="self-start" disabled={loading} onClick={reveal}>
          {loading ? "Writing the model answer…" : "Show the model answer"}
        </Button>
      )}

      <div role="group" aria-label="Score yourself" className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {LABELS.map((label, i) => {
          const n = i + 1
          const on = picked === n
          return (
            <button
              key={label}
              type="button"
              aria-pressed={on}
              disabled={pending}
              onClick={() => score(n)}
              className={cn(
                "flex min-h-18 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-lg border-2 px-1.5 py-2",
                on ? "border-fill bg-fill text-fill-foreground" : "border-input bg-card text-foreground hover:bg-muted"
              )}
            >
              <span className="font-heading text-xl leading-none font-bold">{n}</span>
              <span className="text-[13px] font-semibold">{label}</span>
              <span className="text-xs opacity-80">back {back(i)}</span>
            </button>
          )
        })}
      </div>

      {error && (
        <p role="alert" className="m-0 text-sm text-destructive">
          {error}
        </p>
      )}

      {saved && picked > 0 && (
        <div role="status" className="flex flex-col gap-1.5 rounded-lg bg-muted px-4 py-3.5">
          <span className="font-semibold">
            Saved as {picked} · {LABELS[picked - 1]}. {drill.title} comes back {back(picked - 1)}.
          </span>
          <span className="text-sm text-body">
            {picked === 1 && drill.lessonNumber ? (
              <>
                Normal for a first pass.{" "}
                <Link href={`/library?n=${drill.lessonNumber}`} className="text-link underline">
                  Reread Lesson {drill.lessonNumber}
                </Link>{" "}
                before it returns.
              </>
            ) : picked <= 2 ? (
              "Say the model answer out loud once now; that is usually enough."
            ) : (
              "Good. Nothing else to do today."
            )}
          </span>
        </div>
      )}
    </Card>
  )
}
