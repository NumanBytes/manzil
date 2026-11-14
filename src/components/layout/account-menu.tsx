"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { signOut } from "next-auth/react"
import { applyTheme, THEME_STORAGE_KEY, type ThemeChoice } from "@/lib/theme"
import { cn } from "@/lib/utils"

const THEMES: { value: ThemeChoice; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "auto", label: "Auto" },
]

function readTheme(): ThemeChoice {
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY)
    if (v === "light" || v === "dark" || v === "auto") return v
  } catch {}
  return "auto"
}

export function AccountMenu({ name, goal }: { name: string; goal?: string | null }) {
  const [open, setOpen] = useState(false)
  // Only shown inside the menu, which never renders on the server, so reading storage here is safe.
  const [theme, setTheme] = useState<ThemeChoice>(() => (typeof window === "undefined" ? "auto" : readTheme()))
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (theme !== "auto") return
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const onChange = () => applyTheme("auto")
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [theme])

  useEffect(() => {
    if (!open) return
    function onPointer(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("pointerdown", onPointer)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("pointerdown", onPointer)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  function chooseTheme(choice: ThemeChoice) {
    setTheme(choice)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, choice)
    } catch {}
    applyTheme(choice)
  }

  const initial = (name.trim()[0] ?? "?").toUpperCase()
  const itemClass =
    "flex min-h-11 items-center rounded-md px-3 font-medium text-foreground no-underline hover:bg-muted"

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="grid size-11 cursor-pointer place-items-center rounded-full border-0 bg-transparent p-0"
      >
        <span className="grid size-10 place-items-center rounded-full bg-fill font-bold text-fill-foreground">
          {initial}
        </span>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute top-12 right-0 flex w-[260px] flex-col gap-0.5 rounded-lg border border-border bg-popover p-2 text-popover-foreground shadow-[0_12px_32px_rgba(16,24,40,0.16)]"
        >
          <div className="mb-1.5 border-b border-border px-3 pt-2.5 pb-3">
            <span className="block font-semibold">{name}</span>
            {goal && <span className="block text-[13px] text-muted-foreground">{goal}</span>}
          </div>
          <Link role="menuitem" href="/paths/new" className={itemClass} onClick={() => setOpen(false)}>
            New path
          </Link>
          <div className="flex min-h-11 items-center justify-between gap-2 px-3">
            <span className="font-medium">Theme</span>
            <span role="group" aria-label="Theme" className="inline-flex rounded-full border border-border p-0.5">
              {THEMES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  aria-pressed={theme === t.value}
                  onClick={() => chooseTheme(t.value)}
                  className={cn(
                    "min-h-8 cursor-pointer rounded-full border-0 px-2.5 text-[13px] font-semibold",
                    theme === t.value ? "bg-fill text-fill-foreground" : "bg-transparent text-muted-foreground"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </span>
          </div>
          <button
            role="menuitem"
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className={cn(itemClass, "mt-1.5 cursor-pointer border-0 border-t border-border bg-transparent text-left text-muted-foreground")}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
