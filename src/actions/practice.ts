"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { currentUserId } from "@/lib/session"
import { setDailyItem } from "@/lib/activity"
import { nextSunday, todayKey } from "@/lib/dates"
import {
  problemAttemptSchema,
  REVIEW_INTERVAL_DAYS,
  topicScoreSchema,
  type ProblemAttemptInput,
  type TopicScoreInput,
} from "@/lib/validations/practice"
import { fail } from "./result"

export async function logProblemAttempt(input: ProblemAttemptInput) {
  const userId = await currentUserId()
  if (!userId) return fail("You must be signed in.")
  const parsed = problemAttemptSchema.safeParse(input)
  if (!parsed.success) return fail("Invalid attempt.")
  const { problemId, outcome, minutes, redoOfLogId } = parsed.data

  const [problem, user] = await Promise.all([
    prisma.problem.findUnique({ where: { id: problemId } }),
    prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { timezone: true } }),
  ])
  if (!problem) return fail("Problem not found.")

  const now = new Date()
  await prisma.$transaction(async (tx) => {
    await tx.codingLog.create({
      data: {
        userId,
        problemId,
        problemName: problem.title,
        platform: problem.platform,
        difficulty: problem.difficulty,
        outcome,
        minutes,
        solvedAt: now,
        // A problem you couldn't solve comes back as next Sunday's redo.
        redoDueAt: outcome === "FAILED" ? nextSunday(todayKey(user.timezone)) : null,
      },
    })
    if (redoOfLogId) {
      await tx.codingLog.updateMany({ where: { id: redoOfLogId, userId }, data: { redoneAt: now } })
    }
  })
  await setDailyItem(userId, "solve", true)
  revalidatePath("/", "layout")
  return { success: true as const }
}

export async function scoreTopic(input: TopicScoreInput) {
  const userId = await currentUserId()
  if (!userId) return fail("You must be signed in.")
  const parsed = topicScoreSchema.safeParse(input)
  if (!parsed.success) return fail("Invalid score.")
  const { topicId, score } = parsed.data

  const topic = await prisma.topic.findUnique({ where: { id: topicId }, select: { id: true } })
  if (!topic) return fail("Topic not found.")

  const now = new Date()
  const dueAt = new Date(now.getTime() + REVIEW_INTERVAL_DAYS[score - 1] * 86_400_000)
  const existing = await prisma.topicReview.findUnique({ where: { userId_topicId: { userId, topicId } } })
  const history = [...((existing?.history as { score: number; at: string }[] | null) ?? []), { score, at: now.toISOString() }]

  await prisma.topicReview.upsert({
    where: { userId_topicId: { userId, topicId } },
    create: { userId, topicId, score, dueAt, lastScoredAt: now, history },
    update: { score, dueAt, lastScoredAt: now, timesDrilled: { increment: 1 }, history },
  })
  await setDailyItem(userId, "drill", true)
  revalidatePath("/", "layout")
  return { success: true as const }
}
