"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { learningStyles, masteryLevels } from "@manzil/shared"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createPath } from "@/actions/paths"

const MASTERY_OPTIONS: { value: (typeof masteryLevels)[number]; label: string; description: string }[] = [
  { value: "JOB_READY", label: "Job ready", description: "Enough to be hired for it" },
  { value: "SKILL_MASTERY", label: "Skill mastery", description: "Deep, confident command" },
  { value: "SENIOR_LEVEL", label: "Senior level", description: "Can lead and teach it" },
]

const STYLE_OPTIONS: { value: (typeof learningStyles)[number]; label: string }[] = [
  { value: "PROJECT_BASED", label: "Project-based" },
  { value: "COURSE_BASED", label: "Courses" },
  { value: "READING", label: "Reading & docs" },
  { value: "MIXED", label: "A mix" },
]

export default function NewPathPage() {
  const router = useRouter()

  const [title, setTitle] = useState("")
  const [goal, setGoal] = useState("")
  const [description, setDescription] = useState("")
  const [masteryLevel, setMasteryLevel] = useState<(typeof masteryLevels)[number]>("JOB_READY")
  const [learningStyle, setLearningStyle] = useState<(typeof learningStyles)[number]>("PROJECT_BASED")
  const [targetDate, setTargetDate] = useState("")
  const [dailyHours, setDailyHours] = useState("2")

  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const canSubmit =
    title.trim().length >= 3 &&
    goal.trim().length >= 3 &&
    targetDate !== "" &&
    Number(dailyHours) >= 0.5

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const result = await createPath({
      title: title.trim(),
      goal: goal.trim(),
      // The schema treats description as optional, so send undefined rather
      // than an empty string when it was left blank.
      description: description.trim() || undefined,
      masteryLevel,
      learningStyle,
      targetDate,
      dailyHours,
    })

    if (!result.success) {
      setError(result.error)
      setLoading(false)
      return
    }

    router.push("/paths")
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">New path</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          What do you want to learn, and by when?
        </p>
      </header>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            autoFocus
            placeholder="Backend engineering with Node"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="goal">Goal</Label>
          <Input
            id="goal"
            placeholder="Ship and deploy a production Express API"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description (optional)</Label>
          <Textarea
            id="description"
            rows={3}
            placeholder="Anything else worth remembering about this path."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm leading-none font-medium">Target level</legend>
          <div className="space-y-2 pt-1">
            {MASTERY_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setMasteryLevel(option.value)}
                className={`w-full rounded-md border p-3 text-left transition-colors ${
                  masteryLevel === option.value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted"
                }`}
              >
                <div className="font-medium text-foreground">{option.label}</div>
                <div className="text-sm text-muted-foreground">{option.description}</div>
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="text-sm leading-none font-medium">How you&apos;ll learn it</legend>
          <div className="flex flex-wrap gap-2 pt-1">
            {STYLE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setLearningStyle(option.value)}
                className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                  learningStyle === option.value
                    ? "border-primary bg-primary/5 text-foreground"
                    : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="targetDate">Target date</Label>
            <Input
              id="targetDate"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dailyHours">Hours per day</Label>
            <Input
              id="dailyHours"
              type="number"
              min={0.5}
              max={16}
              step={0.5}
              value={dailyHours}
              onChange={(e) => setDailyHours(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            disabled={loading}
            render={<Link href="/paths" />}
          >
            Cancel
          </Button>
          <Button type="submit" className="flex-1" disabled={!canSubmit || loading}>
            {loading ? "Creating..." : "Create path"}
          </Button>
        </div>
      </form>
    </div>
  )
}
