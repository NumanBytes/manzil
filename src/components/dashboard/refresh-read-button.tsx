"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export function RefreshReadButton({ label }: { label: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  async function refresh() {
    setBusy(true)
    setError("")
    try {
      const res = await fetch("/api/ai/weekly-read", { method: "POST" })
      if (res.ok) router.refresh()
      else setError((await res.json().catch(() => null))?.error ?? "Couldn't write the read.")
    } catch {
      setError("You seem to be offline.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        disabled={busy}
        onClick={refresh}
        className="self-start border-off bg-transparent text-hero-foreground hover:bg-white/10"
      >
        {busy ? "Reading your week…" : label}
      </Button>
      {error && (
        <p role="alert" className="m-0 text-sm text-hero-muted">
          {error}
        </p>
      )}
    </>
  )
}
