"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardTitle } from "@/components/shared/primitives"
import { createProject, logJournal, setProjectStatus } from "@/actions/projects"
import { cn } from "@/lib/utils"

type Project = {
  id: string
  title: string
  status: "BUILDING" | "LIVE"
  techStack: string[]
  entries: number
  lastEntry: string | null
}

export function PathProjects({ projects }: { projects: Project[] }) {
  const [pending, start] = useTransition()
  const [log, setLog] = useState("")
  const [projectId, setProjectId] = useState(projects.find((p) => p.status === "BUILDING")?.id ?? projects[0]?.id ?? "")
  const [adding, setAdding] = useState(projects.length === 0)
  const [title, setTitle] = useState("")
  const [stack, setStack] = useState("")
  const [message, setMessage] = useState("")

  function submitLog(e: React.FormEvent) {
    e.preventDefault()
    setMessage("")
    start(async () => {
      const res = await logJournal({ projectId, content: log })
      if (res.success) {
        setLog("")
        setMessage("Logged.")
      } else setMessage(res.error)
    })
  }

  function submitProject(e: React.FormEvent) {
    e.preventDefault()
    setMessage("")
    start(async () => {
      const res = await createProject({ title, techStack: stack })
      if (res.success) {
        setTitle("")
        setStack("")
        setAdding(false)
      } else setMessage(res.error)
    })
  }

  return (
    <Card className="gap-3.5 p-[22px]">
      <CardTitle>Projects</CardTitle>
      {projects.map((p, i) => (
        <div key={p.id} className={cn("flex flex-col gap-1", i > 0 && "border-t border-border pt-3.5")}>
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold">{p.title}</span>
            <button
              type="button"
              disabled={pending}
              title={p.status === "LIVE" ? "Mark as building" : "Mark as live"}
              onClick={() => start(async () => void (await setProjectStatus(p.id, p.status === "LIVE" ? "BUILDING" : "LIVE")))}
              className={cn(
                "cursor-pointer rounded-full border-0 px-2.5 py-0.5 text-[13px] font-semibold",
                p.status === "LIVE" ? "bg-fill text-fill-foreground" : "bg-pin-soft text-pin-ink"
              )}
            >
              {p.status === "LIVE" ? "live" : "building now"}
            </button>
          </div>
          <span className="text-sm text-muted-foreground">
            {[p.techStack.join(", "), `${p.entries} ${p.entries === 1 ? "entry" : "entries"} logged`].filter(Boolean).join(" · ")}
          </span>
          {p.lastEntry && <span className="text-sm text-body">Last: {p.lastEntry}</span>}
        </div>
      ))}

      {projects.length > 0 && (
        <form onSubmit={submitLog} className="flex flex-col gap-1.5 border-t border-border pt-3.5">
          <Label htmlFor="log" className="leading-normal">
            What did you ship or decide today?
          </Label>
          {projects.length > 1 && (
            <select
              aria-label="Project"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="h-11 rounded-lg border border-input bg-card px-3 text-foreground"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          )}
          <Input id="log" value={log} onChange={(e) => setLog(e.target.value)} placeholder="Schema for paths and steps, first migration" className="h-11" />
          <Button type="submit" variant="outline" className="self-start" disabled={pending || log.trim().length < 2}>
            Log it
          </Button>
        </form>
      )}

      {adding ? (
        <form onSubmit={submitProject} className="flex flex-col gap-2 border-t border-border pt-3.5">
          <Label htmlFor="p-title" className="leading-normal">
            {projects.length ? "Add a project" : "A project you're building"}
          </Label>
          <Input id="p-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Manzil" className="h-11" />
          <Input
            aria-label="Tech stack, comma separated"
            value={stack}
            onChange={(e) => setStack(e.target.value)}
            placeholder="Next.js, Prisma, PostgreSQL"
            className="h-11"
          />
          <Button type="submit" variant="outline" className="self-start" disabled={pending || title.trim().length < 2}>
            Add project
          </Button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="cursor-pointer self-start border-0 bg-transparent p-0 text-sm font-semibold text-link underline"
        >
          Add a project
        </button>
      )}
      {message && (
        <p role="status" className="m-0 text-sm text-muted-foreground">
          {message}
        </p>
      )}
    </Card>
  )
}
