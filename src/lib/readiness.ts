import { prisma } from "@/lib/prisma"
import { addDays, todayKey } from "@/lib/dates"
import type { TrailNode } from "@/components/shared/trail"

/** Self-scored interview readiness, 0–100, in four parts. */
export const READINESS_WEIGHTS = { problems: 35, concepts: 35, mocks: 20, consistency: 10 } as const
/** Points needed for full marks in problem solving: alone = 1, with a hint = 0.5. */
const PROBLEM_TARGET = 40
export const MOCK_UNLOCK_DRILLS = 5

export const BANDS = [
  { at: 0, label: "Early days" },
  { at: 25, label: "Building" },
  { at: 50, label: "Interview-capable" },
  { at: 75, label: "Ready" },
] as const

export function bandFor(score: number) {
  return [...BANDS].reverse().find((b) => score >= b.at)!.label
}

type Inputs = {
  attempts: { problemId: string | null; outcome: string | null; solvedAt: Date }[]
  reviews: { score: number; lastScoredAt: Date }[]
  totalProblems: number
  totalTopics: number
  activeDays: Set<string>
  today: string
}

function compute({ attempts, reviews, totalProblems, totalTopics, activeDays, today }: Inputs) {
  // Best outcome per problem.
  const best = new Map<string, number>()
  for (const a of attempts) {
    if (!a.problemId) continue
    const v = a.outcome === "SOLVED" ? 1 : a.outcome === "HINT" ? 0.5 : 0
    best.set(a.problemId, Math.max(best.get(a.problemId) ?? 0, v))
  }
  const alone = [...best.values()].filter((v) => v === 1).length
  const hint = [...best.values()].filter((v) => v === 0.5).length
  const problemPts = alone + hint * 0.5
  const problems = Math.round(READINESS_WEIGHTS.problems * Math.min(1, problemPts / PROBLEM_TARGET))

  const conceptPts = reviews.reduce((a, r) => a + (r.score >= 3 ? 1 : 0.5), 0)
  const concepts = totalTopics ? Math.round(READINESS_WEIGHTS.concepts * Math.min(1, conceptPts / totalTopics)) : 0
  const strong = reviews.filter((r) => r.score >= 3).length

  let active14 = 0
  for (let i = 0; i < 14; i++) if (activeDays.has(addDays(today, -i))) active14++
  const consistency = Math.round((READINESS_WEIGHTS.consistency * active14) / 14)

  const mocks = 0
  const score = problems + concepts + mocks + consistency

  return {
    score,
    band: bandFor(score),
    parts: [
      { name: "Problem solving", note: `${alone} alone, ${hint} with a hint, of ${totalProblems}`, score: problems, max: READINESS_WEIGHTS.problems },
      { name: "Concepts", note: `${reviews.length} of ${totalTopics} drilled, ${strong} scored 3 or 4`, score: concepts, max: READINESS_WEIGHTS.concepts },
      { name: "Mock interviews", note: "mock interviews are not in Manzil yet", score: mocks, max: READINESS_WEIGHTS.mocks },
      { name: "Consistency", note: `active ${active14} of the last 14 days`, score: consistency, max: READINESS_WEIGHTS.consistency },
    ],
    drilled: reviews.length,
  }
}

export async function getReadiness(userId: string, timeZone: string) {
  const today = todayKey(timeZone)
  const [attempts, reviews, totalProblems, totalTopics, days] = await Promise.all([
    prisma.codingLog.findMany({ where: { userId }, select: { problemId: true, outcome: true, solvedAt: true } }),
    prisma.topicReview.findMany({ where: { userId }, select: { score: true, lastScoredAt: true, history: true } }),
    prisma.problem.count(),
    prisma.topic.count(),
    prisma.dayActivity.findMany({
      where: { userId, day: { gte: addDays(today, -40) } },
      select: { day: true, lesson: true, solve: true, drill: true, build: true },
    }),
  ])
  const active = new Set(days.filter((d) => d.lesson || d.solve || d.drill || d.build).map((d) => d.day))

  const now = compute({ attempts, reviews, totalProblems, totalTopics, activeDays: active, today })

  // The same score as it stood a week ago, for "up N since last week".
  const weekAgo = new Date(Date.now() - 7 * 86_400_000)
  const pastReviews = reviews
    .map((r) => {
      const hist = (Array.isArray(r.history) ? r.history : []) as { score: number; at: string }[]
      const before = hist.filter((h) => new Date(h.at) <= weekAgo)
      const last = before[before.length - 1]
      return last ? { score: last.score, lastScoredAt: new Date(last.at) } : null
    })
    .filter((r): r is { score: number; lastScoredAt: Date } => !!r)
  const then = compute({
    attempts: attempts.filter((a) => a.solvedAt <= weekAgo),
    reviews: pastReviews,
    totalProblems,
    totalTopics,
    activeDays: active,
    today: addDays(today, -7),
  })
  const hasHistory = attempts.length > 0 || reviews.length > 0

  return { ...now, delta: now.score - then.score, hasHistory }
}

export function readinessScale(score: number): TrailNode[] {
  const nodes: TrailNode[] = BANDS.map((b) => ({ label: `${b.at} · ${b.label}`, state: score >= b.at ? "done" : "ahead" }))
  const idx = nodes.findIndex((n) => n.state === "ahead")
  const you: TrailNode = { label: `${score} · you`, state: "here" }
  if (idx === -1) nodes.push(you)
  else nodes.splice(idx, 0, you)
  nodes.push({ label: "100", state: "ahead" })
  return nodes
}
