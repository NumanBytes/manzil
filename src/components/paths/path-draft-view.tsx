"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, Eyebrow, PageHeading } from "@/components/shared/primitives"
import { Trail, type TrailNode } from "@/components/shared/trail"
import { discardDraft, startPath } from "@/actions/paths"
import type { NewPathAnswers } from "@/lib/validations/paths"

type Props = {
  draft: {
    id: string
    title: string
    goal: string
    summary: string
    weeks: number
    hours: number
    stops: TrailNode[]
    milestones: { title: string; why: string; meta: string; steps: { kind: string; title: string; hours: number }[] }[]
  }
  answers: NewPathAnswers
}

const KIND: Record<string, string> = { LEARN: "Learn", BUILD: "Build", PROVE: "Prove" }

export function PathDraftView({ draft, answers }: Props) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [open, setOpen] = useState<number | null>(null)
  const [error, setError] = useState("")

  function begin() {
    setError("")
    start(async () => {
      const res = await startPath(draft.id)
      if (res.success) router.push("/paths")
      else setError(res.error)
    })
  }

  function changeAnswers() {
    try {
      sessionStorage.setItem("manzil-new-path-answers", JSON.stringify(answers))
    } catch {}
    start(async () => {
      await discardDraft(draft.id)
      router.push("/paths/new")
    })
  }

  return (
    <main className="mx-auto box-border flex w-full max-w-[900px] flex-1 flex-col gap-[18px] px-4 pt-4 pb-6 md:px-6 md:pt-7 md:pb-18">
      <div className="flex flex-col gap-1.5">
        <Eyebrow>
          Your draft · about {draft.weeks} weeks · {draft.hours} h
        </Eyebrow>
        <PageHeading>{draft.title}</PageHeading>
        <p className="m-0 text-muted-foreground">{draft.summary}</p>
      </div>
      <Card className="gap-4 p-[18px] md:px-7 md:py-6">
        <Trail nodes={draft.stops} />
        {draft.milestones.map((m, i) => (
          <div key={m.title + i} className="flex flex-col gap-1.5 border-t border-border pt-3">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <span className="font-bold">{m.title}</span>
              <span className="text-[13px] text-muted-foreground">{m.meta}</span>
            </div>
            <span className="text-sm text-muted-foreground">{m.why}</span>
            <button
              type="button"
              aria-expanded={open === i}
              onClick={() => setOpen(open === i ? null : i)}
              className="cursor-pointer self-start border-0 bg-transparent p-0 text-sm font-semibold text-link underline"
            >
              {open === i ? "Hide steps" : "Show steps"}
            </button>
            {open === i && (
              <ol className="m-0 flex list-none flex-col gap-1 p-0">
                {m.steps.map((s, j) => (
                  <li key={j} className="flex flex-wrap items-baseline gap-2 text-sm">
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-body">{KIND[s.kind] ?? s.kind}</span>
                    <span className="min-w-0 flex-1">{s.title}</span>
                    <span className="text-muted-foreground">{s.hours} h</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        ))}
        {error && (
          <p role="alert" className="m-0 text-sm text-destructive">
            {error}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3 pt-1.5">
          <Button size="lg" disabled={pending} onClick={begin}>
            {pending ? "Starting…" : "Start this path"}
          </Button>
          <Button size="lg" variant="ghost" className="px-3 text-muted-foreground underline" disabled={pending} onClick={changeAnswers}>
            Change my answers
          </Button>
        </div>
      </Card>
    </main>
  )
}
