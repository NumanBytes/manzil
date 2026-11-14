"use server"

import { revalidatePath } from "next/cache"
import { prisma } from "@/lib/prisma"
import { currentUserId } from "@/lib/session"
import { setDailyItem } from "@/lib/activity"
import { idSchema, moveDateSchema } from "@/lib/validations/paths"
import { fail } from "./result"

const NOT_SIGNED_IN = "You must be signed in."

function refresh() {
  revalidatePath("/", "layout")
}

async function ownedPath(userId: string, pathId: string) {
  return prisma.path.findFirst({ where: { id: pathId, userId } })
}

/** Turn a draft into the user's main path. */
export async function startPath(pathId: string) {
  const userId = await currentUserId()
  if (!userId) return fail(NOT_SIGNED_IN)
  if (!idSchema.safeParse(pathId).success) return fail("Invalid path.")
  const path = await ownedPath(userId, pathId)
  if (!path) return fail("Path not found.")

  const answers = (path.answers ?? {}) as { project?: string }
  await prisma.$transaction(async (tx) => {
    await tx.path.updateMany({ where: { userId, isMain: true }, data: { isMain: false } })
    // The plan clock starts when the path starts, not when the draft was drawn.
    await tx.path.update({ where: { id: pathId }, data: { status: "ACTIVE", isMain: true, createdAt: new Date() } })
    const projectTitle = answers.project?.split(":")[0]?.trim()
    if (projectTitle) {
      const exists = await tx.project.findFirst({ where: { userId, title: { equals: projectTitle, mode: "insensitive" } } })
      if (!exists) {
        const stack = answers.project!.includes(":") ? answers.project!.split(":").slice(1).join(":") : ""
        await tx.project.create({
          data: {
            userId,
            title: projectTitle,
            techStack: stack.split(",").map((s) => s.trim()).filter(Boolean),
            targetDate: path.targetDate,
          },
        })
      }
    }
  })
  refresh()
  return { success: true as const }
}

export async function discardDraft(pathId: string) {
  const userId = await currentUserId()
  if (!userId) return fail(NOT_SIGNED_IN)
  await prisma.path.deleteMany({ where: { id: pathId, userId, status: "DRAFT" } })
  return { success: true as const }
}

export async function setMainPath(pathId: string) {
  const userId = await currentUserId()
  if (!userId) return fail(NOT_SIGNED_IN)
  const path = await ownedPath(userId, pathId)
  if (!path || path.status !== "ACTIVE") return fail("Path not found.")
  await prisma.$transaction([
    prisma.path.updateMany({ where: { userId, isMain: true }, data: { isMain: false } }),
    prisma.path.update({ where: { id: pathId }, data: { isMain: true } }),
  ])
  refresh()
  return { success: true as const }
}

export async function archivePath(pathId: string) {
  const userId = await currentUserId()
  if (!userId) return fail(NOT_SIGNED_IN)
  const path = await ownedPath(userId, pathId)
  if (!path) return fail("Path not found.")
  await prisma.path.update({ where: { id: pathId }, data: { status: "ARCHIVED", isMain: false } })
  // Promote the most recent remaining active path, if any.
  const next = await prisma.path.findFirst({ where: { userId, status: "ACTIVE" }, orderBy: { updatedAt: "desc" } })
  if (next) await prisma.path.update({ where: { id: next.id }, data: { isMain: true } })
  refresh()
  return { success: true as const }
}

export async function toggleSubtask(subtaskId: string) {
  const userId = await currentUserId()
  if (!userId) return fail(NOT_SIGNED_IN)
  const sub = await prisma.subTask.findFirst({
    where: { id: subtaskId, step: { milestone: { path: { userId } } } },
    select: { id: true, isCompleted: true, step: { select: { milestone: { select: { pathId: true } } } } },
  })
  if (!sub) return fail("Sub-task not found.")
  await prisma.subTask.update({
    where: { id: sub.id },
    data: { isCompleted: !sub.isCompleted, completedAt: sub.isCompleted ? null : new Date() },
  })
  await prisma.path.update({ where: { id: sub.step.milestone.pathId }, data: { lastActivityAt: new Date() } })
  refresh()
  return { success: true as const }
}

/** Mark a step done (or not). Completing the last step completes its milestone. Counts as today's build. */
export async function setStepDone(stepId: string, done: boolean) {
  const userId = await currentUserId()
  if (!userId) return fail(NOT_SIGNED_IN)
  const step = await prisma.step.findFirst({
    where: { id: stepId, milestone: { path: { userId } } },
    select: { id: true, milestoneId: true, milestone: { select: { pathId: true } } },
  })
  if (!step) return fail("Step not found.")

  const now = new Date()
  await prisma.$transaction(async (tx) => {
    await tx.step.update({ where: { id: step.id }, data: { isCompleted: done, completedAt: done ? now : null } })
    const open = await tx.step.count({ where: { milestoneId: step.milestoneId, isCompleted: false } })
    await tx.milestone.update({
      where: { id: step.milestoneId },
      data: { isCompleted: open === 0, completedAt: open === 0 ? now : null },
    })
    await tx.path.update({ where: { id: step.milestone.pathId }, data: { lastActivityAt: now } })
  })
  if (done) await setDailyItem(userId, "build", true)
  refresh()
  return { success: true as const }
}

/** "Move it N days": accept the projected date as the new target. */
export async function moveTargetDate(pathId: string, days: number) {
  const userId = await currentUserId()
  if (!userId) return fail(NOT_SIGNED_IN)
  const parsed = moveDateSchema.safeParse({ pathId, days })
  if (!parsed.success) return fail("Invalid date change.")
  const path = await ownedPath(userId, pathId)
  if (!path) return fail("Path not found.")
  await prisma.path.update({
    where: { id: pathId },
    data: { targetDate: new Date(path.targetDate.getTime() + days * 86_400_000) },
  })
  refresh()
  return { success: true as const }
}
