"use client"

import { useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { buttonVariants } from "@/components/ui/button"
import { archivePath, setMainPath } from "@/actions/paths"
import { cn } from "@/lib/utils"

type P = { id: string; title: string; isMain: boolean }

export function PathSwitcher({ paths, currentId }: { paths: P[]; currentId: string }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const current = paths.find((p) => p.id === currentId)

  return (
    <details className="relative">
      <summary className={cn(buttonVariants({ variant: "outline" }), "list-none [&::-webkit-details-marker]:hidden")}>
        All paths ({paths.length})
      </summary>
      <div className="absolute right-0 z-10 mt-2 flex w-[300px] flex-col gap-0.5 rounded-lg border border-border bg-popover p-2 shadow-[0_12px_32px_rgba(16,24,40,0.16)]">
        {paths.map((p) => (
          <Link
            key={p.id}
            href={`/paths?path=${p.id}`}
            aria-current={p.id === currentId ? "page" : undefined}
            className={cn(
              "flex min-h-11 items-center justify-between gap-2 rounded-md px-3 text-sm no-underline hover:bg-muted",
              p.id === currentId ? "font-semibold text-foreground" : "text-muted-foreground"
            )}
          >
            <span className="min-w-0 truncate">{p.title}</span>
            {p.isMain && <span className="flex-none text-xs text-pin-ink">main</span>}
          </Link>
        ))}
        {current && (
          <div className="mt-1 flex flex-wrap gap-2 border-t border-border px-1 pt-2">
            {!current.isMain && (
              <button
                type="button"
                disabled={pending}
                onClick={() => start(async () => void (await setMainPath(current.id)))}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                Make this my main path
              </button>
            )}
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                if (!confirm(`Archive "${current.title}"? Its history stays, but it leaves Today.`)) return
                start(async () => {
                  await archivePath(current.id)
                  router.push("/paths")
                })
              }}
              className={buttonVariants({ variant: "ghost", size: "sm", className: "text-muted-foreground" })}
            >
              Archive this path
            </button>
          </div>
        )}
      </div>
    </details>
  )
}
