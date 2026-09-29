"use client"

import { useState, useTransition } from "react"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { deletePath } from "@/actions/paths"

/**
 * Calls the delete Server Action, which in turn calls the API. `useTransition`
 * keeps the pending state local so the row can disable itself while the server
 * revalidates the list.
 */
export function DeletePathButton({ id, title }: { id: string; title: string }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")

  function handleDelete() {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return

    startTransition(async () => {
      const result = await deletePath(id)
      if (!result.success) setError(result.error)
    })
  }

  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-xs text-destructive">{error}</span>}
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`Delete ${title}`}
        disabled={isPending}
        onClick={handleDelete}
      >
        <Trash2 />
      </Button>
    </div>
  )
}
