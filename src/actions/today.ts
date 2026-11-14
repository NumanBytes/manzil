"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { currentUserId } from "@/lib/session"
import { DAILY_ITEMS, setDailyItem, type DailyItem } from "@/lib/activity"
import { fail } from "./result"

/** Manual tick on Today, for when the work happened outside Manzil. */
export async function setTodayItem(item: DailyItem, done: boolean) {
  const userId = await currentUserId()
  if (!userId) return fail("You must be signed in.")
  if (!z.enum(DAILY_ITEMS).safeParse(item).success) return fail("Invalid item.")
  await setDailyItem(userId, item, done)
  revalidatePath("/", "layout")
  return { success: true as const }
}

export async function markLessonRead(lessonId: string) {
  const userId = await currentUserId()
  if (!userId) return fail("You must be signed in.")
  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId }, select: { id: true } })
  if (!lesson) return fail("Lesson not found.")
  await prisma.lessonRead.upsert({
    where: { userId_lessonId: { userId, lessonId } },
    create: { userId, lessonId },
    update: {},
  })
  await setDailyItem(userId, "lesson", true)
  revalidatePath("/", "layout")
  return { success: true as const }
}

/** Keep the stored timezone in step with the browser so "today" means the user's today. */
export async function syncTimezone(timeZone: string) {
  const userId = await currentUserId()
  if (!userId) return fail("You must be signed in.")
  try {
    new Intl.DateTimeFormat("en", { timeZone })
  } catch {
    return fail("Unknown timezone.")
  }
  await prisma.user.update({ where: { id: userId }, data: { timezone: timeZone } })
  return { success: true as const }
}
