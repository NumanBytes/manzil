import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { currentUserId } from "@/lib/session"
import { aiErrorResponse, generateStructured } from "@/lib/ai/client"
import { LESSON_SYSTEM, lessonSchema } from "@/lib/ai/prompts"
import { unlockedLessonCount } from "@/lib/data/library"

export const maxDuration = 120

const bodySchema = z.object({ number: z.number().int().min(1).max(10000) })

/** Writes a lesson's body the first time anyone opens it, then serves it from the database. */
export async function POST(req: Request) {
  const userId = await currentUserId()
  if (!userId) return Response.json({ error: "Sign in first." }, { status: 401 })
  const parsed = bodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return Response.json({ error: "Invalid lesson." }, { status: 400 })

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { timezone: true, courseStartedAt: true } })
  if (parsed.data.number > (await unlockedLessonCount(user))) {
    return Response.json({ error: "That lesson hasn't arrived yet." }, { status: 403 })
  }

  const lesson = await prisma.lesson.findUnique({ where: { number: parsed.data.number } })
  if (!lesson) return Response.json({ error: "Lesson not found." }, { status: 404 })
  if (lesson.content) return Response.json({ ok: true })

  const earlier = await prisma.lesson.findMany({
    where: { number: { lt: lesson.number, gte: lesson.number - 3 } },
    orderBy: { number: "asc" },
    select: { number: true, title: true },
  })

  try {
    const content = await generateStructured({
      system: LESSON_SYSTEM,
      prompt: `Lesson ${lesson.number}: ${lesson.title}
Module: ${lesson.module}
Earlier lessons it builds on: ${earlier.map((e) => `Lesson ${e.number}, ${e.title}`).join("; ") || "none, this is the start of the course"}`,
      schema: lessonSchema,
    })
    // Two people opening the same new lesson at once: keep whichever finished first.
    await prisma.lesson.updateMany({
      where: { id: lesson.id, generatedAt: null },
      data: { content, generatedAt: new Date() },
    })
    return Response.json({ ok: true })
  } catch (err) {
    return aiErrorResponse(err)
  }
}
