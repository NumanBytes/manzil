import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { currentUserId } from "@/lib/session"
import { aiErrorResponse, generateStructured } from "@/lib/ai/client"
import { STEP_SPLIT_SYSTEM, stepSplitSchema } from "@/lib/ai/prompts"

export const maxDuration = 60

const bodySchema = z.object({ stepId: z.string().min(1).max(64) })

export async function POST(req: Request) {
  const userId = await currentUserId()
  if (!userId) return Response.json({ error: "Sign in first." }, { status: 401 })
  const parsed = bodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return Response.json({ error: "Invalid step." }, { status: 400 })

  const step = await prisma.step.findFirst({
    where: { id: parsed.data.stepId, milestone: { path: { userId } } },
    include: {
      subtasks: { orderBy: { order: "asc" } },
      milestone: { select: { title: true, path: { select: { title: true, user: { select: { techStack: true } } } } } },
    },
  })
  if (!step) return Response.json({ error: "Step not found." }, { status: 404 })

  const minutes = Math.round((step.estimatedHours ?? 1) * 60)
  const already = step.subtasks.length
    ? `\nThe current split was:\n${step.subtasks.map((s) => `- ${s.title} (${s.minutes} min)`).join("\n")}\nThe developer says it is still too big: make the sub-tasks smaller and more concrete.`
    : ""

  try {
    const split = await generateStructured({
      system: STEP_SPLIT_SYSTEM,
      prompt: `Path: ${step.milestone.path.title}
Milestone: ${step.milestone.title}
Step (${step.kind.toLowerCase()}, about ${minutes} minutes): ${step.title}
Developer's stack: ${step.milestone.path.user.techStack.join(", ") || "not given"}${already}`,
      schema: stepSplitSchema,
    })

    await prisma.$transaction([
      prisma.subTask.deleteMany({ where: { stepId: step.id } }),
      prisma.subTask.createMany({
        data: split.subtasks.map((s, i) => ({
          stepId: step.id,
          title: s.title,
          minutes: Math.min(120, Math.max(5, Math.round(s.minutes))),
          order: i,
        })),
      }),
      prisma.step.update({ where: { id: step.id }, data: { doneLooksLike: split.doneLooksLike, resourceNote: split.resource } }),
    ])
    return Response.json({ ok: true })
  } catch (err) {
    return aiErrorResponse(err)
  }
}
