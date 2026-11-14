import { prisma } from "@/lib/prisma"
import { currentUserId } from "@/lib/session"
import { aiErrorResponse, generateStructured } from "@/lib/ai/client"
import { PATH_DRAFT_SYSTEM, pathDraftSchema } from "@/lib/ai/prompts"
import { newPathAnswersSchema, weeklyHoursFrom, type NewPathAnswers } from "@/lib/validations/paths"

export const maxDuration = 120

function learningStyleFor(style: string) {
  if (/build first/i.test(style)) return "PROJECT_BASED" as const
  if (/read first/i.test(style)) return "READING" as const
  return "MIXED" as const
}

function masteryFor(titles: string[]) {
  return titles.some((t) => /senior|lead|staff|principal/i.test(t)) ? ("SENIOR_LEVEL" as const) : ("JOB_READY" as const)
}

function describeAnswers(a: NewPathAnswers, weeklyHours: number, weeksToStart: number, otherPaths: string[]) {
  const titles = [...a.titles, a.otherTitle].filter(Boolean).join("; ")
  return [
    `Target titles: ${titles}`,
    a.jobPosts ? `Job posts they would love to get:\n"""\n${a.jobPosts}\n"""` : "No job posts pasted.",
    `Role today: ${a.roleToday || "not given"}, ${a.years} years of professional work.`,
    `Confident with: ${a.confident || "not given"}`,
    `Touched but not confident: ${a.touched || "not given"}`,
    `Skip entirely: ${a.skip || "nothing"}`,
    `Market: ${a.market}. Interview rounds expected: ${a.rounds.join(", ") || "not sure"}.`,
    `Wants to start interviewing in ${a.startMonth}, about ${weeksToStart} weeks from now.`,
    `Proof an interviewer would believe: ${a.proofs.join(", ") || "not given"}.`,
    a.project ? `Project they want this path to build or finish: ${a.project}` : "No specific project.",
    `Time on a bad week: about ${Math.round(weeklyHours * 10) / 10} hours a week (${a.weekdayMinutes} min on weekdays, ${a.weekendHours} h per weekend day, days off: ${a.daysOff.join(", ") || "none"}).`,
    `Learning style: ${a.style}. AI while practising: ${a.ai}. Interview language: ${a.language || "English"}.`,
    `Worries: ${a.worries.join(", ") || "none named"}.`,
    a.badInterview ? `Last interview that went badly: ${a.badInterview}` : "",
    otherPaths.length ? `They already have these paths, so don't duplicate them: ${otherPaths.join("; ")}` : "",
  ]
    .filter(Boolean)
    .join("\n")
}

export async function POST(req: Request) {
  const userId = await currentUserId()
  if (!userId) return Response.json({ error: "Sign in first." }, { status: 401 })

  const parsed = newPathAnswersSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return Response.json({ error: parsed.error.issues[0]?.message ?? "Check your answers." }, { status: 400 })
  }
  const answers = parsed.data

  const [y, m] = answers.startMonth.split("-").map(Number)
  const targetDate = new Date(Date.UTC(y, m - 1, 1))
  if (targetDate.getTime() < Date.now() + 7 * 86_400_000) {
    return Response.json({ error: "Pick a start month at least a week away." }, { status: 400 })
  }
  const weeklyHours = Math.max(1, weeklyHoursFrom(answers))
  const weeksToStart = Math.round((targetDate.getTime() - Date.now()) / (7 * 86_400_000))

  const others = await prisma.path.findMany({ where: { userId, status: "ACTIVE" }, select: { title: true } })

  try {
    const draft = await generateStructured({
      system: PATH_DRAFT_SYSTEM,
      prompt: `Draw a path for this developer.\n\n${describeAnswers(answers, weeklyHours, weeksToStart, others.map((o) => o.title))}`,
      schema: pathDraftSchema,
      effort: "high",
    })

    const milestones = draft.milestones.filter((ms) => ms.steps.length > 0)
    if (!milestones.length) return Response.json({ error: "The draft came back empty. Try again." }, { status: 502 })

    // One draft at a time: drawing again replaces the previous one.
    await prisma.path.deleteMany({ where: { userId, status: "DRAFT" } })
    const path = await prisma.path.create({
      data: {
        userId,
        status: "DRAFT",
        title: draft.title,
        description: draft.summary,
        goal: draft.destination,
        masteryLevel: masteryFor(answers.titles),
        learningStyle: learningStyleFor(answers.style),
        isAIGenerated: true,
        targetDate,
        weeklyHours,
        dailyHours: weeklyHours / 7,
        answers,
        milestones: {
          create: milestones.map((ms, i) => ({
            title: ms.title,
            description: ms.why,
            order: i,
            steps: {
              create: ms.steps.map((st, j) => ({
                title: st.title,
                kind: st.kind,
                order: j,
                estimatedHours: Math.min(4, Math.max(0.25, Math.round(st.hours * 4) / 4)),
              })),
            },
          })),
        },
      },
      include: { milestones: { orderBy: { order: "asc" }, include: { steps: true } } },
    })

    return Response.json({ id: path.id })
  } catch (err) {
    return aiErrorResponse(err)
  }
}
