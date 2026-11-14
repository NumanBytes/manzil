"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { syncTimezone } from "@/actions/today"

/** Stores the browser's timezone once it differs from the saved one, so "today" means the user's today. */
export function TimezoneSync({ saved }: { saved: string }) {
  const router = useRouter()
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (tz && tz !== saved) {
      syncTimezone(tz).then((r) => {
        if (r.success) router.refresh()
      })
    }
  }, [saved, router])
  return null
}
