import { z } from "zod"

export const problemAttemptSchema = z.object({
  problemId: z.string().min(1).max(64),
  outcome: z.enum(["SOLVED", "HINT", "FAILED"]),
  minutes: z.number().int().min(0).max(240),
  /** When this attempt is a Sunday redo, the earlier failed log it closes. */
  redoOfLogId: z.string().min(1).max(64).optional(),
})
export type ProblemAttemptInput = z.infer<typeof problemAttemptSchema>

export const topicScoreSchema = z.object({
  topicId: z.string().min(1).max(64),
  score: z.number().int().min(1).max(4),
})
export type TopicScoreInput = z.infer<typeof topicScoreSchema>

/** Days until a topic comes back, by self-score 1–4. */
export const REVIEW_INTERVAL_DAYS = [1, 3, 7, 14] as const
