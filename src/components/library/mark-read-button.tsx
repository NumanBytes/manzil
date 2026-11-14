"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { markLessonRead } from "@/actions/today"

export function MarkReadButton({ lessonId, isRead, disabled }: { lessonId: string; isRead: boolean; disabled?: boolean }) {
  const [read, setRead] = useState(isRead)
  const [pending, start] = useTransition()
  const [error, setError] = useState("")

  if (read) return <span className="inline-flex min-h-12 items-center font-semibold text-muted-foreground">Read ✓</span>

  return (
    <>
      <Button
        size="lg"
        disabled={disabled || pending}
        onClick={() =>
          start(async () => {
            const res = await markLessonRead(lessonId)
            if (res.success) setRead(true)
            else setError(res.error)
          })
        }
      >
        Mark as read
      </Button>
      {error && <span role="alert" className="text-sm text-destructive">{error}</span>}
    </>
  )
}
