import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { currentUserId } from "@/lib/session"
import { aiErrorResponse, generateStructured } from "@/lib/ai/client"
import { MODEL_ANSWER_SYSTEM, modelAnswerSchema } from "@/lib/ai/prompts"

export const maxDuration = 60

const bodySchema = z.object({ topicId: z.string().min(1).max(64) })

/** A drill's model answer, written once per topic and cached. */
export async function POST(req: Request) {
  const userId = await currentUserId()
  if (!userId) return Response.json({ error: "Sign in first." }, { status: 401 })
  const parsed = bodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return Response.json({ error: "Invalid topic." }, { status: 400 })

  const topic = await prisma.topic.findUnique({ where: { id: parsed.data.topicId } })
  if (!topic) return Response.json({ error: "Topic not found." }, { status: 404 })
  if (topic.modelAnswer) return Response.json({ points: JSON.parse(topic.modelAnswer).points })

  try {
    const answer = await generateStructured({
      system: MODEL_ANSWER_SYSTEM,
      prompt: `Track: ${topic.track}\nQuestion: ${topic.prompt}`,
      schema: modelAnswerSchema,
    })
    await prisma.topic.update({ where: { id: topic.id }, data: { modelAnswer: JSON.stringify(answer) } })
    return Response.json({ points: answer.points })
  } catch (err) {
    return aiErrorResponse(err)
  }
}
