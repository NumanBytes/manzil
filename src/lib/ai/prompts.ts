import { z } from "zod"

const PRODUCT = `You work inside Manzil, a personal growth app for software developers. Manzil turns a target job into a path of small steps and hands the developer four things a day: one lesson, one interview problem, one spoken concept drill, and one build step on their path. The tone is calm, plain and specific: short sentences, no hype, no emoji.`

/* ---------------- Path draft ---------------- */

export const pathDraftSchema = z.object({
  title: z.string().describe("Path title naming the stack, e.g. 'Senior Full Stack: Next.js + NestJS + PostgreSQL'"),
  destination: z.string().describe("The target role in 2-4 words, e.g. 'Full Stack Engineer'. Shown as the flag at the end of the trail."),
  summary: z
    .string()
    .describe("Two sentences: what the path skips because the developer already knows it, and what it moved earlier and why."),
  milestones: z.array(
    z.object({
      title: z.string().describe("2-5 words"),
      why: z.string().describe("One sentence on why this milestone is here, tied to the developer's answers"),
      steps: z.array(
        z.object({
          kind: z.enum(["LEARN", "BUILD", "PROVE"]),
          title: z.string().describe("A concrete, finishable action in under 15 words"),
          hours: z.number().describe("Estimated hours, between 0.5 and 3"),
        })
      ),
    })
  ),
})
export type PathDraft = z.infer<typeof pathDraftSchema>

export const PATH_DRAFT_SYSTEM = `${PRODUCT}

You are drawing a learning path backwards from the developer's target job.

Rules:
- 4 to 7 milestones, in the order they should be walked. Each has 4 to 8 steps.
- Steps are LEARN (read or watch, then explain), BUILD (write code), or PROVE (a timed or shown result an interviewer would believe). Every milestone ends with exactly one PROVE step.
- Each step is one sitting: 0.5 to 3 hours. Prefer BUILD steps; aim for roughly 25% LEARN, 55% BUILD, 20% PROVE, adjusted to their learning style.
- Skip what they list as confident or 'skip entirely'. Spend time on what they 'touched but are not confident' with.
- Move topics they named as worries earlier. If they named a project, make the BUILD steps build that project wherever it fits.
- Size the whole path so it fits their weekly hours before their start date where possible; if it cannot fit, keep it honest rather than cramming.
- Never invent URLs, course names or statistics.`

/* ---------------- Split a step ---------------- */

export const stepSplitSchema = z.object({
  subtasks: z.array(
    z.object({
      title: z.string().describe("One concrete action, under 14 words"),
      minutes: z.number().describe("Whole minutes, 5 to 40"),
    })
  ),
  doneLooksLike: z.string().describe("One sentence: the observable result that means this step is done"),
  resource: z.string().describe("One sentence naming the official docs pages or the developer's own code to use. No URLs."),
})
export type StepSplit = z.infer<typeof stepSplitSchema>

export const STEP_SPLIT_SYSTEM = `${PRODUCT}

Split one step of a developer's path into 3 to 6 sub-tasks done in order, whose minutes add up to roughly the step's estimate. Each sub-task must be small enough to start immediately. Then say what 'done' looks like and what to use. Name documentation by its official title and section; never write URLs.`

/* ---------------- Lesson ---------------- */

export const lessonSchema = z.object({
  intro: z.string().describe("One or two sentences that state the core idea plainly"),
  buildsOn: z.string().describe("One or two sentences linking to the earlier lessons named in the prompt, by number"),
  bigIdea: z.array(z.string()).describe("2-3 short paragraphs explaining the idea with one everyday analogy"),
  code: z.string().describe("A short, runnable code example (under 20 lines). Empty string if code would not help."),
  codeLanguage: z.string().describe("e.g. 'javascript', 'typescript', 'sql', 'bash'; empty if no code"),
  afterCode: z.string().describe("One paragraph explaining what the code shows. Empty if no code."),
  interviewQuestion: z.string().describe("One interview question this lesson prepares for"),
  interviewAnswer: z.string().describe("A strong 2-4 sentence answer to it"),
})
export type LessonContent = z.infer<typeof lessonSchema>

export const LESSON_SYSTEM = `${PRODUCT}

Write one lesson of Manzil's daily course: a five-minute read in plain words for a working developer who wants to understand how things really work and explain them in interviews. Be accurate. Prefer one sharp analogy over several. Do not pad.`

/* ---------------- Drill model answer ---------------- */

export const modelAnswerSchema = z.object({
  points: z.array(
    z.object({
      lead: z.string().describe("2-4 word bold lead-in, e.g. 'A closure'"),
      rest: z.string().describe("The rest of the sentence or two"),
    })
  ),
})
export type ModelAnswer = z.infer<typeof modelAnswerSchema>

export const MODEL_ANSWER_SYSTEM = `${PRODUCT}

Write the model answer a strong candidate would give, out loud, to one interview question. 3 or 4 points, each one or two sentences, in the order you'd say them. Accurate and concrete. For questions about the candidate's own CV, give the structure of a strong answer instead of inventing their experience.`

/* ---------------- Weekly read ---------------- */

export const weeklyReadSchema = z.object({
  read: z.string().describe("Two or three sentences: what actually happened this week, citing the numbers"),
  oneChange: z.string().describe("One concrete change for next week, starting with a verb, under 20 words"),
})
export type WeeklyRead = z.infer<typeof weeklyReadSchema>

export const WEEKLY_READ_SYSTEM = `${PRODUCT}

Write the developer's honest weekly read from their logs. Say plainly what went well and what slipped, using only the numbers given; never invent activity. No praise padding, no guilt. Then give exactly one change for next week.`
