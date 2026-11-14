"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

export function RevealAnswer({ children }: { children: React.ReactNode }) {
  const [shown, setShown] = useState(false)

  if (shown) return <span className="text-body">{children}</span>

  return (
    <Button variant="outline" className="self-start whitespace-normal" onClick={() => setShown(true)}>
      Answer it out loud first, then reveal
    </Button>
  )
}
