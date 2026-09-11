import { z } from "zod"
import { learningStyles } from "./onboarding"

export const masteryLevels = ["JOB_READY", "SKILL_MASTERY", "SENIOR_LEVEL"] as const

export const createPathSchema = z.object({
  title: z.string().min(3, "Give the path a title").max(120),
  description: z.string().max(2000).optional(),
  goal: z.string().min(3, "What is this path for?").max(500),
  masteryLevel: z.enum(masteryLevels),
  learningStyle: z.enum(learningStyles),
  isPublic: z.boolean().default(false),
  targetDate: z.coerce.date().refine((d) => d.getTime() > Date.now(), {
    message: "Target date must be in the future",
  }),
  dailyHours: z.coerce.number().min(0.5, "Must be at least 0.5").max(16),
})

/** Every field optional, but the body must change at least one of them. */
export const updatePathSchema = createPathSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Provide at least one field to update",
  })

export const listPathsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
  isPublic: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
})

export const pathIdParamSchema = z.object({
  id: z.string().min(1),
})

export type CreatePathInput = z.infer<typeof createPathSchema>
export type UpdatePathInput = z.infer<typeof updatePathSchema>
export type ListPathsQuery = z.infer<typeof listPathsQuerySchema>
export type MasteryLevel = (typeof masteryLevels)[number]
