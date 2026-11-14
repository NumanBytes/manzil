import { prisma } from "@/lib/prisma"
import { currentUserId } from "@/lib/session"
import { aiErrorResponse, generateStructured } from "@/lib/ai/client"
import { WEEKLY_READ_SYSTEM, weeklyReadSchema } from "@/lib/ai/prompts"
import { addDays, keyToDate, todayKey } from "@/lib/dates"
import { pathStats } from "@/lib/pace"
import { getReadiness } from "@/lib/readiness"

export const maxDuration = 60

const REFRESH_COOLDOWN_MS = 30 * 60_000

export async function POST() {
  const userId = await currentUserId()
  if (!userId) return Response.json({ error: "Sign in first." }, { status: 401 })

  const last = await prisma.weeklyReport.findFirst({ where: { userId }, orderBy: { generatedAt: "desc" } })
  if (last && Date.now() - last.generatedAt.getTime() < REFRESH_COOLDOWN_MS) {
    return Response.json({ error: "You refreshed this recently. Nothing much has changed since." }, { status: 429 })
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { timezone: true } })
  const today = todayKey(user.timezone)
  const from = addDays(today, -6)
  const since = keyToDate(addDays(today, -7))

  const [days, reads, attempts, reviews, steps, mainPath, readiness] = await Promise.all([
    prisma.dayActivity.findMany({ where: { userId, day: { gte: from } } }),
    prisma.lessonRead.count({ where: { userId, readAt: { gte: since } } }),
    prisma.codingLog.findMany({ where: { userId, solvedAt: { gte: since } }, select: { outcome: true, problemName: true } }),
    prisma.topicReview.findMany({
      where: { userId, lastScoredAt: { gte: since } },
      select: { score: true, topic: { select: { title: true } } },
    }),
    prisma.step.count({ where: { isCompleted: true, completedAt: { gte: since }, milestone: { path: { userId } } } }),
    prisma.path.findFirst({
      where: { userId, isMain: true },
      include: { milestones: { orderBy: { order: "asc" }, include: { steps: true } } },
    }),
    getReadiness(userId, user.timezone),
  ])

  const count = (k: "lesson" | "solve" | "drill" | "build") => days.filter((d) => d[k]).length
  const stats = mainPath ? pathStats(mainPath) : null

  const facts = [
    `Days active in the last 7: ${days.filter((d) => d.lesson || d.solve || d.drill || d.build).length}.`,
    `Days with each item done: lesson ${count("lesson")}, problem ${count("solve")}, drill ${count("drill")}, path step ${count("build")}.`,
    `Lessons marked read: ${reads}.`,
    `Problems: ${attempts.length} attempted; ${attempts.filter((a) => a.outcome === "SOLVED").length} solved alone, ${attempts.filter((a) => a.outcome === "HINT").length} with a hint, ${attempts.filter((a) => a.outcome === "FAILED").length} not solved.`,
    `Drills scored: ${reviews.map((r) => `${r.topic.title} ${r.score}/4`).join(", ") || "none"}.`,
    `Path steps completed: ${steps}.`,
    stats
      ? `Main path "${mainPath!.title}": ${stats.walkedPct}% walked, plan says ${stats.planPct}%. ${stats.daysBehindPlan > 0 ? `${stats.daysBehindPlan} days behind plan` : stats.daysBehindPlan < 0 ? `${-stats.daysBehindPlan} days ahead of plan` : "on plan"}. Planned ${Math.round(mainPath!.weeklyHours * 10) / 10} h/week.`
      : "No main path yet.",
    `Interview readiness: ${readiness.score}/100 (${readiness.band}), ${readiness.delta >= 0 ? "up" : "down"} ${Math.abs(readiness.delta)} on last week.`,
  ].join("\n")

  try {
    const read = await generateStructured({
      system: WEEKLY_READ_SYSTEM,
      prompt: `This week's logs:\n${facts}`,
      schema: weeklyReadSchema,
      maxTokens: 4000,
      effort: "low",
    })
    await prisma.weeklyReport.create({
      data: {
        userId,
        content: JSON.stringify(read),
        weekStart: keyToDate(from),
        weekEnd: keyToDate(today),
        driftScore: stats?.daysBehindPlan ?? 0,
      },
    })
    return Response.json({ ok: true })
  } catch (err) {
    return aiErrorResponse(err)
  }
}
