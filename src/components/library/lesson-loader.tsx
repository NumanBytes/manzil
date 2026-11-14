"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

/** First open of a lesson: asks the server to write it, then re-renders with the stored content. */
export function LessonLoader({ number }: { number: number }) {
  const router = useRouter()
  const [error, setError] = useState("")
  const [attempt, setAttempt] = useState(0)
  const started = useRef<number | null>(null)

  useEffect(() => {
    if (started.current === attempt) return
    started.current = attempt
    fetch("/api/ai/lesson", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ number }),
    })
      .then(async (res) => {
        if (res.ok) router.refresh()
        else setError((await res.json().catch(() => null))?.error ?? "Couldn't load this lesson.")
      })
      .catch(() => setError("You seem to be offline."))
  }, [number, attempt, router])

  if (error) {
    return (
      <div role="alert" className="flex flex-col items-start gap-3 rounded-lg bg-accent px-5 py-4">
        <span>{error}</span>
        <Button
          variant="outline"
          onClick={() => {
            setError("")
            setAttempt((a) => a + 1)
          }}
        >
          Try again
        </Button>
      </div>
    )
  }

  return (
    <p role="status" className="m-0 rounded-lg bg-muted px-5 py-4 text-body">
      This lesson is being written for the first time. It takes about half a minute and is saved for next time.
    </p>
  )
}
