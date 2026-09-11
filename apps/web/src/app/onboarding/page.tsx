"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { completeOnboarding } from "@/actions/onboarding"
import { learningStyles, type OnboardingInput } from "@manzil/shared"

const TOTAL_STEPS = 6

const LEARNING_STYLE_OPTIONS: { value: (typeof learningStyles)[number]; label: string; description: string }[] = [
  { value: "PROJECT_BASED", label: "Project-based", description: "Learn by building real things" },
  { value: "COURSE_BASED", label: "Structured courses", description: "Follow a curriculum, step by step" },
  { value: "READING", label: "Reading & docs", description: "Books, docs, articles" },
  { value: "MIXED", label: "A mix of everything", description: "Whatever fits the moment" },
]

export default function OnboardingPage() {
  const router = useRouter()
  const { update } = useSession()

  const [step, setStep] = useState(1)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const [currentRole, setCurrentRole] = useState("")
  const [yearsOfExp, setYearsOfExp] = useState("")
  const [techStack, setTechStack] = useState<string[]>([])
  const [techInput, setTechInput] = useState("")
  const [goal, setGoal] = useState("")
  const [learningStyle, setLearningStyle] = useState<(typeof learningStyles)[number] | "">("")
  const [dailyHours, setDailyHours] = useState("")

  function addTech() {
    const value = techInput.trim()
    if (value && !techStack.includes(value)) {
      setTechStack([...techStack, value])
    }
    setTechInput("")
  }

  function removeTech(value: string) {
    setTechStack(techStack.filter((t) => t !== value))
  }

  function canProceed() {
    switch (step) {
      case 1:
        return currentRole.trim().length >= 2
      case 2:
        return yearsOfExp !== "" && Number(yearsOfExp) >= 0
      case 3:
        return techStack.length > 0
      case 4:
        return goal.trim().length >= 3
      case 5:
        return learningStyle !== ""
      case 6:
        return dailyHours !== "" && Number(dailyHours) > 0
      default:
        return false
    }
  }

  function handleBack() {
    setError("")
    setStep((s) => Math.max(1, s - 1))
  }

  async function handleNext() {
    if (step < TOTAL_STEPS) {
      setStep((s) => s + 1)
      return
    }
    await handleSubmit()
  }

  async function handleSubmit() {
    setLoading(true)
    setError("")

    const input: OnboardingInput = {
      currentRole,
      yearsOfExp: Number(yearsOfExp),
      techStack,
      goal,
      learningStyle: learningStyle as (typeof learningStyles)[number],
      dailyHours: Number(dailyHours),
    }

    const result = await completeOnboarding(input)

    if (!result.success) {
      setError(result.error)
      setLoading(false)
      return
    }

    await update({ onboarded: true })
    router.push("/dashboard")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 p-8">

        {/* Progress */}
        <div className="flex gap-2">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full ${i < step ? "bg-primary" : "bg-muted"}`}
            />
          ))}
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
            {error}
          </div>
        )}

        {/* Step content */}
        {step === 1 && (
          <div className="space-y-3">
            <div>
              <h1 className="text-2xl font-bold text-foreground">What&apos;s your current role?</h1>
              <p className="mt-1 text-sm text-muted-foreground">So we know where you&apos;re starting from.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="currentRole">Current role</Label>
              <Input
                id="currentRole"
                autoFocus
                placeholder="Frontend Developer"
                value={currentRole}
                onChange={(e) => setCurrentRole(e.target.value)}
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Years of experience?</h1>
              <p className="mt-1 text-sm text-muted-foreground">A rough estimate is fine.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="yearsOfExp">Years</Label>
              <Input
                id="yearsOfExp"
                autoFocus
                type="number"
                min={0}
                max={60}
                placeholder="2"
                value={yearsOfExp}
                onChange={(e) => setYearsOfExp(e.target.value)}
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <div>
              <h1 className="text-2xl font-bold text-foreground">What&apos;s your tech stack?</h1>
              <p className="mt-1 text-sm text-muted-foreground">Type one and press Enter to add it.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="techInput">Technologies</Label>
              <Input
                id="techInput"
                autoFocus
                placeholder="React"
                value={techInput}
                onChange={(e) => setTechInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault()
                    addTech()
                  }
                }}
              />
              {techStack.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {techStack.map((tech) => (
                    <button
                      key={tech}
                      type="button"
                      onClick={() => removeTech(tech)}
                      className="text-xs bg-secondary text-secondary-foreground px-3 py-1 rounded-full hover:bg-secondary/70"
                    >
                      {tech} ×
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-3">
            <div>
              <h1 className="text-2xl font-bold text-foreground">What&apos;s your goal?</h1>
              <p className="mt-1 text-sm text-muted-foreground">What are you working toward?</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal">Goal</Label>
              <Input
                id="goal"
                autoFocus
                placeholder="Become job-ready as a full-stack engineer"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
              />
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-3">
            <div>
              <h1 className="text-2xl font-bold text-foreground">How do you like to learn?</h1>
            </div>
            <div className="space-y-2">
              {LEARNING_STYLE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setLearningStyle(option.value)}
                  className={`w-full text-left p-3 rounded-md border transition-colors ${
                    learningStyle === option.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted"
                  }`}
                >
                  <div className="font-medium text-foreground">{option.label}</div>
                  <div className="text-sm text-muted-foreground">{option.description}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-3">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Daily hours you can commit?</h1>
              <p className="mt-1 text-sm text-muted-foreground">Be realistic — this drives your pace.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dailyHours">Hours per day</Label>
              <Input
                id="dailyHours"
                autoFocus
                type="number"
                min={0.5}
                max={16}
                step={0.5}
                placeholder="2"
                value={dailyHours}
                onChange={(e) => setDailyHours(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3">
          {step > 1 && (
            <Button type="button" variant="outline" className="flex-1" onClick={handleBack} disabled={loading}>
              Back
            </Button>
          )}
          <Button type="button" className="flex-1" onClick={handleNext} disabled={!canProceed() || loading}>
            {step === TOTAL_STEPS ? (loading ? "Saving..." : "Finish") : "Next"}
          </Button>
        </div>

      </div>
    </div>
  )
}
