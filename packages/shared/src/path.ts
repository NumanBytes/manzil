import { z } from "zod"
import { learningStyles, type LearningStyle } from "./onboarding"

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

/**
 * A Path as it travels over HTTP.
 *
 * This is deliberately not Prisma's `Path` type. Two reasons:
 *   1. `res.json()` serialises Date to an ISO string, so the client never
 *      receives a Date. Reusing Prisma's type here would type a lie.
 *   2. apps/web must not depend on @manzil/db, so the response shape needs a
 *      home the frontend can import.
 *
 * apps/api maps its Prisma rows onto this in paths.mapper.ts, which is what
 * keeps the two in step: if the schema changes, that mapper stops compiling.
 */
export type PathDto = {
  id: string
  title: string
  description: string | null
  goal: string
  masteryLevel: MasteryLevel
  learningStyle: LearningStyle
  isPublic: boolean
  isAIGenerated: boolean
  /** ISO 8601 */
  targetDate: string
  dailyHours: number
  driftDays: number
  /** ISO 8601, or null if the path has never been worked on */
  lastActivityAt: string | null
  createdAt: string
  updatedAt: string
  userId: string
}

/**
 * What a form submits, before Zod coerces it. `CreatePathInput` is the parsed
 * output — `targetDate` there is a Date and `isPublic` is required — whereas a
 * form only ever holds strings and may omit defaulted fields.
 */
export type CreatePathFormInput = z.input<typeof createPathSchema>
