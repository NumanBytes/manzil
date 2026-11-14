import { prisma } from "@/lib/prisma"
import { todayKey } from "@/lib/dates"

export const DAILY_ITEMS = ["lesson", "drill", "solve", "build"] as const
export type DailyItem = (typeof DAILY_ITEMS)[number]

/** Mark (or unmark) one of today's four things for a user, in their timezone. */
export async function setDailyItem(userId: string, item: DailyItem, value = true) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { timezone: true } })
  const day = todayKey(user.timezone)
  await prisma.dayActivity.upsert({
    where: { userId_day: { userId, day } },
    create: { userId, day, [item]: value },
    update: { [item]: value },
  })
}

export function countDone(a: { lesson: boolean; drill: boolean; solve: boolean; build: boolean } | null | undefined) {
  if (!a) return 0
  return DAILY_ITEMS.filter((k) => a[k]).length
}
