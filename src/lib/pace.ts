import type { TrailNode } from "@/components/shared/trail"

type StepLike = { estimatedHours: number | null; isCompleted: boolean; completedAt: Date | null }
type MilestoneLike = { title: string; isCompleted: boolean; steps: StepLike[] }
type PathLike = {
  goal: string
  createdAt: Date
  targetDate: Date
  weeklyHours: number
  milestones: MilestoneLike[]
}

const DAY = 86_400_000
const hoursOf = (s: StepLike) => s.estimatedHours ?? 1

export type PathStats = ReturnType<typeof pathStats>

/**
 * Everything the Trail, the pace card and the hero sentence need, computed from the path itself.
 * Pace is the hours of steps actually completed over the last 28 days; until there are two weeks of
 * history it falls back to the hours the user said they'd keep.
 */
export function pathStats(path: PathLike, now = new Date()) {
  const steps = path.milestones.flatMap((m) => m.steps)
  const totalHours = steps.reduce((a, s) => a + hoursOf(s), 0) || 1
  const doneHours = steps.filter((s) => s.isCompleted).reduce((a, s) => a + hoursOf(s), 0)
  const walked = doneHours / totalHours

  const start = path.createdAt.getTime()
  const target = path.targetDate.getTime()
  const planAt = target > start ? Math.min(1, Math.max(0, (now.getTime() - start) / (target - start))) : 1

  const since = now.getTime() - 28 * DAY
  const recentHours = steps
    .filter((s) => s.isCompleted && s.completedAt && s.completedAt.getTime() >= since)
    .reduce((a, s) => a + hoursOf(s), 0)
  const ageDays = (now.getTime() - start) / DAY
  const actualWeekly = ageDays >= 14 ? recentHours / Math.min(4, ageDays / 7) : null
  const paceWeekly = actualWeekly && actualWeekly > 0 ? actualWeekly : path.weeklyHours

  const remaining = Math.max(0, totalHours - doneHours)
  const landsOn = new Date(now.getTime() + (remaining / Math.max(0.25, paceWeekly)) * 7 * DAY)
  const daysLate = Math.round((landsOn.getTime() - target) / DAY)
  const weeksLeft = Math.max(0.1, (target - now.getTime()) / (7 * DAY))
  const neededWeekly = remaining / weeksLeft

  const plannedHoursByNow = planAt * totalHours
  const daysBehindPlan = Math.round((plannedHoursByNow - doneHours) / Math.max(0.1, path.weeklyHours / 7))

  const hereIdx = path.milestones.findIndex((m) => !m.isCompleted)
  const stops: TrailNode[] = [
    ...path.milestones.map((m, i) => ({
      label: m.title,
      state: (m.isCompleted ? "done" : i === hereIdx ? "here" : "ahead") as TrailNode["state"],
    })),
    { label: path.goal, state: hereIdx === -1 ? "here" : "ahead" },
  ]

  return {
    totalHours,
    doneHours,
    walked,
    walkedPct: Math.round(walked * 100),
    planAt,
    planPct: Math.round(planAt * 100),
    actualWeekly,
    paceWeekly,
    neededWeekly,
    landsOn,
    daysLate,
    daysBehindPlan,
    currentMilestoneIndex: hereIdx,
    finished: hereIdx === -1,
    stops,
    // The trail's x-axis is milestones, so map the plan fraction onto the same axis.
    trailPlan: trailPosition(path.milestones, planAt * totalHours),
  }
}

/** Convert an hours-walked figure into a 0–1 position on a trail whose nodes are milestones plus the flag. */
function trailPosition(milestones: MilestoneLike[], hours: number) {
  const n = milestones.length
  if (!n) return 0
  let acc = 0
  for (let i = 0; i < n; i++) {
    const h = milestones[i].steps.reduce((a, s) => a + hoursOf(s), 0) || 1
    if (hours <= acc + h) return (i + (hours - acc) / h) / n
    acc += h
  }
  return 1
}

export function formatHours(h: number) {
  if (h < 1) return `${Math.round(h * 60)} min`
  return `${Math.round(h * 10) / 10} h`
}

export function paceSentence(stats: PathStats) {
  if (stats.finished) return "You arrived. Every milestone on this path is done."
  const d = stats.daysBehindPlan
  const base = `${stats.walkedPct}% walked. The plan says ${stats.planPct}% by today`
  if (d > 1) return `${base}, so you are ${d} days behind.`
  if (d < -1) return `${base}, so you are ${-d} days ahead.`
  return `${base}, so you are on pace.`
}
