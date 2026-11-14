"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { currentUserId } from "@/lib/session"
import { journalSchema, projectSchema } from "@/lib/validations/paths"
import { fail } from "./result"

export async function createProject(input: { title: string; techStack: string }) {
  const userId = await currentUserId()
  if (!userId) return fail("You must be signed in.")
  const parsed = projectSchema.safeParse(input)
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid project")

  const main = await prisma.path.findFirst({ where: { userId, isMain: true }, select: { targetDate: true } })
  await prisma.project.create({
    data: {
      userId,
      title: parsed.data.title,
      techStack: parsed.data.techStack.split(",").map((s) => s.trim()).filter(Boolean),
      targetDate: main?.targetDate ?? new Date(Date.now() + 90 * 86_400_000),
    },
  })
  revalidatePath("/paths")
  return { success: true as const }
}

export async function logJournal(input: { projectId: string; content: string }) {
  const userId = await currentUserId()
  if (!userId) return fail("You must be signed in.")
  const parsed = journalSchema.safeParse(input)
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid entry")
  const project = await prisma.project.findFirst({ where: { id: parsed.data.projectId, userId }, select: { id: true } })
  if (!project) return fail("Project not found.")

  await prisma.$transaction([
    prisma.journalEntry.create({ data: { projectId: project.id, content: parsed.data.content } }),
    prisma.project.update({ where: { id: project.id }, data: { lastActivityAt: new Date() } }),
  ])
  revalidatePath("/paths")
  return { success: true as const }
}

export async function setProjectStatus(projectId: string, status: "BUILDING" | "LIVE") {
  const userId = await currentUserId()
  if (!userId) return fail("You must be signed in.")
  const res = await prisma.project.updateMany({ where: { id: projectId, userId }, data: { status } })
  if (!res.count) return fail("Project not found.")
  revalidatePath("/paths")
  return { success: true as const }
}
