import { z } from "zod"

export const learningStyles = ["PROJECT_BASED", "COURSE_BASED", "READING", "MIXED"] as const

export const onboardingSchema = z.object({
  currentRole: z.string().min(2, "Tell us your current role"),
  yearsOfExp: z.coerce.number().min(0, "Must be 0 or more").max(60),
  techStack: z.array(z.string().min(1)).min(1, "Add at least one technology"),
  goal: z.string().min(3, "Tell us your goal"),
  learningStyle: z.enum(learningStyles),
  dailyHours: z.coerce.number().min(0.5, "Must be at least 0.5").max(16),
})

export type OnboardingInput = z.infer<typeof onboardingSchema>
