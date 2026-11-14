"use client"

import { Button } from "@/components/ui/button"

// Placeholder until the weekly read is generated server-side via the Claude API route.
export function RefreshReadButton() {
  return (
    <Button
      variant="outline"
      className="self-start border-off bg-transparent text-hero-foreground hover:bg-white/10"
    >
      Refresh the read
    </Button>
  )
}
