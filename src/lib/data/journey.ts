import { prisma } from "@/lib/prisma"

export const pathInclude = {
  milestones: {
    orderBy: { order: "asc" },
    include: { steps: { orderBy: { order: "asc" }, include: { subtasks: { orderBy: { order: "asc" } } } } },
  },
} as const

export async function getMainPath(userId: string) {
  return prisma.path.findFirst({
    where: { userId, isMain: true, status: "ACTIVE" },
    include: pathInclude,
  })
}

export async function getJourney(userId: string, pathId?: string) {
  const [paths, projects] = await Promise.all([
    prisma.path.findMany({
      where: { userId, status: "ACTIVE" },
      orderBy: [{ isMain: "desc" }, { updatedAt: "desc" }],
      select: { id: true, title: true, isMain: true },
    }),
    prisma.project.findMany({
      where: { userId },
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
      include: { _count: { select: { journal: true } }, journal: { orderBy: { createdAt: "desc" }, take: 1 } },
    }),
  ])
  const id = pathId && paths.some((p) => p.id === pathId) ? pathId : paths[0]?.id
  const path = id ? await prisma.path.findUnique({ where: { id }, include: pathInclude }) : null
  return { paths, path, projects }
}

export type JourneyPath = NonNullable<Awaited<ReturnType<typeof getJourney>>["path"]>

/** The first unfinished step, in milestone order. */
export function currentStep(path: JourneyPath) {
  for (const m of path.milestones) {
    const s = m.steps.find((st) => !st.isCompleted)
    if (s) return { milestone: m, step: s }
  }
  return null
}

export async function getDraft(userId: string, pathId: string) {
  return prisma.path.findFirst({
    where: { id: pathId, userId, status: "DRAFT" },
    include: { milestones: { orderBy: { order: "asc" }, include: { steps: { orderBy: { order: "asc" } } } } },
  })
}
