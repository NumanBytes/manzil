import { prisma } from "@/lib/prisma"
import { dayKey, daysBetween, todayKey } from "@/lib/dates"
import type { LessonContent } from "@/lib/ai/prompts"

type CourseUser = { timezone: string; courseStartedAt: Date }

/** One lesson arrives per day, starting the day the account was created. */
export async function unlockedLessonCount(user: CourseUser) {
  const total = await prisma.lesson.count()
  const days = daysBetween(dayKey(user.courseStartedAt, user.timezone), todayKey(user.timezone))
  return Math.min(total, Math.max(1, days + 1))
}

export async function getLibrary(userId: string, user: CourseUser, requested?: number) {
  const [lessons, reads, unlocked] = await Promise.all([
    prisma.lesson.findMany({ orderBy: { number: "asc" }, select: { id: true, number: true, module: true, title: true } }),
    prisma.lessonRead.findMany({ where: { userId }, select: { lessonId: true } }),
    unlockedLessonCount(user),
  ])
  const readIds = new Set(reads.map((r) => r.lessonId))
  const firstUnread = lessons.find((l) => l.number <= unlocked && !readIds.has(l.id))
  const todayNumber = firstUnread?.number ?? null

  const selectedNumber =
    requested && requested >= 1 && requested <= unlocked ? requested : (todayNumber ?? Math.min(unlocked, lessons.length))
  const selected = selectedNumber
    ? await prisma.lesson.findUnique({ where: { number: selectedNumber } })
    : null

  type LessonStatus = "read" | "today" | "open" | "tomorrow" | "locked"
  const status = (l: { id: string; number: number }): LessonStatus =>
    readIds.has(l.id) ? "read" : l.number === todayNumber ? "today" : l.number <= unlocked ? "open" : l.number === unlocked + 1 ? "tomorrow" : "locked"

  const modules: { name: string; lessons: ((typeof lessons)[number] & { status: LessonStatus })[] }[] = []
  for (const l of lessons) {
    const last = modules[modules.length - 1]
    const row = { ...l, status: status(l) }
    if (last?.name === l.module) last.lessons.push(row)
    else modules.push({ name: l.module, lessons: [row] })
  }

  const earlier = selected
    ? lessons.filter((l) => l.number < selected.number && l.number >= selected.number - 2)
    : []

  return {
    total: lessons.length,
    unlocked,
    readCount: readIds.size,
    todayNumber,
    modules,
    selected: selected
      ? {
          id: selected.id,
          number: selected.number,
          module: selected.module,
          title: selected.title,
          content: selected.content as LessonContent | null,
          isRead: readIds.has(selected.id),
          earlier,
        }
      : null,
    next: lessons.find((l) => l.number === (selected?.number ?? 0) + 1) ?? null,
  }
}

export async function getTodaysLesson(userId: string, user: CourseUser) {
  const unlocked = await unlockedLessonCount(user)
  const lesson = await prisma.lesson.findFirst({
    where: { number: { lte: unlocked }, reads: { none: { userId } } },
    orderBy: { number: "asc" },
    select: { id: true, number: true, title: true, module: true },
  })
  const next = await prisma.lesson.findFirst({
    where: { number: { gt: lesson?.number ?? unlocked } },
    orderBy: { number: "asc" },
    select: { number: true, title: true },
  })
  return { lesson, next, unlocked }
}
