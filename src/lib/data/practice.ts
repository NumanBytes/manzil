import { prisma } from "@/lib/prisma"
import { addDays, aroundToday, isToday, keyToDate, todayKey, weekday } from "@/lib/dates"
import { MOCK_UNLOCK_DRILLS } from "@/lib/readiness"
import type { ModelAnswer } from "@/lib/ai/prompts"

/**
 * Today's problem: on Sundays, the oldest problem you couldn't solve that's due for a redo;
 * otherwise the next problem in the list you've never attempted. If you already logged one
 * today, that one stays as today's.
 */
export async function getProblemOfDay(userId: string, timeZone: string) {
  const today = todayKey(timeZone)
  const total = await prisma.problem.count()

  const recent = await prisma.codingLog.findFirst({
    where: { userId, problemId: { not: null }, solvedAt: { gte: aroundToday() } },
    orderBy: { solvedAt: "desc" },
    include: { problem: true },
  })
  const doneToday = recent && isToday(recent.solvedAt, timeZone) ? recent : null

  if (doneToday?.problem) {
    return { problem: doneToday.problem, total, isRedo: false, redoOfLogId: null, doneToday }
  }

  if (weekday(today) === 0) {
    const redo = await prisma.codingLog.findFirst({
      where: { userId, outcome: "FAILED", redoneAt: null, redoDueAt: { lte: keyToDate(addDays(today, 1)) }, problemId: { not: null } },
      orderBy: { redoDueAt: "asc" },
      include: { problem: true },
    })
    if (redo?.problem) return { problem: redo.problem, total, isRedo: true, redoOfLogId: redo.id, doneToday: null }
  }

  const next = await prisma.problem.findFirst({
    where: { logs: { none: { userId } } },
    orderBy: { order: "asc" },
  })
  return { problem: next, total, isRedo: false, redoOfLogId: null, doneToday: null }
}

export function parseModelAnswer(raw: string | null): ModelAnswer["points"] | null {
  if (!raw) return null
  try {
    return (JSON.parse(raw) as ModelAnswer).points
  } catch {
    return null
  }
}

/**
 * Today's drill: a topic you asked for, else one you already scored today, else the most overdue
 * review, else the next topic you've never drilled (optionally within one track).
 */
export async function getDrillOfDay(userId: string, timeZone: string, opts: { topicSlug?: string; track?: string } = {}) {
  const include = { reviews: { where: { userId } } } as const

  let topic = opts.topicSlug ? await prisma.topic.findUnique({ where: { slug: opts.topicSlug }, include }) : null

  if (!topic && !opts.track) {
    const scoredToday = await prisma.topicReview.findFirst({
      where: { userId, lastScoredAt: { gte: aroundToday() } },
      orderBy: { lastScoredAt: "desc" },
      include: { topic: { include } },
    })
    if (scoredToday && isToday(scoredToday.lastScoredAt, timeZone)) topic = scoredToday.topic
  }
  if (!topic && !opts.track) {
    const due = await prisma.topicReview.findFirst({
      where: { userId, dueAt: { lte: new Date() } },
      orderBy: { dueAt: "asc" },
      include: { topic: { include } },
    })
    topic = due?.topic ?? null
  }
  if (!topic) {
    topic = await prisma.topic.findFirst({
      where: { reviews: { none: { userId } }, ...(opts.track ? { track: opts.track } : {}) },
      orderBy: { order: "asc" },
      include,
    })
  }
  if (!topic && opts.track) {
    topic = await prisma.topic.findFirst({ where: { track: opts.track }, orderBy: { order: "asc" }, include })
  }
  if (!topic) return null

  const review = topic.reviews[0] ?? null
  const scoredToday = !!review && isToday(review.lastScoredAt, timeZone)
  return {
    id: topic.id,
    slug: topic.slug,
    track: topic.track,
    title: topic.title,
    prompt: topic.prompt,
    lessonNumber: topic.lessonNumber,
    modelAnswer: parseModelAnswer(topic.modelAnswer),
    isNew: !review,
    lastScore: review?.score ?? null,
    scoredToday: scoredToday ? review!.score : null,
  }
}

export async function getPracticeOverview(userId: string) {
  const [topics, reviews] = await Promise.all([
    prisma.topic.findMany({ orderBy: { order: "asc" }, select: { id: true, slug: true, track: true, title: true, lessonNumber: true } }),
    prisma.topicReview.findMany({ where: { userId }, include: { topic: { select: { slug: true, title: true, lessonNumber: true } } } }),
  ])
  const byTopic = new Map(reviews.map((r) => [r.topicId, r]))

  const tracks: { name: string; total: number; drilled: number; level: number }[] = []
  for (const t of topics) {
    let tr = tracks.find((x) => x.name === t.track)
    if (!tr) tracks.push((tr = { name: t.track, total: 0, drilled: 0, level: 0 }))
    tr.total++
    const r = byTopic.get(t.id)
    if (r) {
      tr.drilled++
      tr.level += r.score
    }
  }
  for (const tr of tracks) tr.level = tr.drilled ? Math.round(tr.level / tr.drilled) : 0

  const weak = reviews
    .filter((r) => r.score <= 2)
    .sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime())
    .map((r) => ({ slug: r.topic.slug, title: r.topic.title, score: r.score, dueAt: r.dueAt, lessonNumber: r.topic.lessonNumber }))

  const drillsDone = reviews.reduce((a, r) => a + r.timesDrilled, 0)
  return {
    totalTopics: topics.length,
    tracks,
    weak,
    mock: { drillsDone: Math.min(drillsDone, MOCK_UNLOCK_DRILLS), needed: MOCK_UNLOCK_DRILLS, unlocked: drillsDone >= MOCK_UNLOCK_DRILLS },
  }
}

export function dueLabel(dueAt: Date, now = new Date()) {
  const days = Math.ceil((dueAt.getTime() - now.getTime()) / 86_400_000)
  if (days <= 0) return "due now"
  if (days === 1) return "back tomorrow"
  return `back in ${days} days`
}
