import { z } from "zod"

const text = (max: number) => z.string().trim().max(max)
const list = z.array(z.string().trim().min(1).max(120)).max(20)

/** The seven New-path questions. */
export const newPathAnswersSchema = z.object({
  titles: list.min(1, "Pick at least one job title"),
  otherTitle: text(120).default(""),
  jobPosts: text(15000).default(""),

  roleToday: text(120).default(""),
  years: z.coerce.number().min(0).max(60).default(0),
  confident: text(500).default(""),
  touched: text(500).default(""),
  skip: text(500).default(""),

  market: text(80).min(1, "Pick a market"),
  rounds: list,
  startMonth: z.string().regex(/^\d{4}-\d{2}$/, "Pick the month you want to start interviewing"),

  proofs: list,
  project: text(200).default(""),

  weekdayMinutes: z.coerce.number().min(10).max(600),
  weekendHours: z.coerce.number().min(0).max(16),
  daysOff: z.array(z.enum(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"])).max(6).default([]),

  style: text(80).min(1),
  ai: text(80).min(1),
  language: text(60).default(""),

  worries: list,
  badInterview: text(2000).default(""),
})
export type NewPathAnswers = z.infer<typeof newPathAnswersSchema>

export function weeklyHoursFrom(a: Pick<NewPathAnswers, "weekdayMinutes" | "weekendHours" | "daysOff">) {
  const offWeekdays = a.daysOff.filter((d) => d !== "Sat" && d !== "Sun").length
  const offWeekend = a.daysOff.filter((d) => d === "Sat" || d === "Sun").length
  return (a.weekdayMinutes / 60) * (5 - offWeekdays) + a.weekendHours * (2 - offWeekend)
}

export const idSchema = z.string().min(1).max(64)

export const journalSchema = z.object({
  projectId: idSchema,
  content: z.string().trim().min(2, "Write a few words").max(2000),
})

export const projectSchema = z.object({
  title: z.string().trim().min(2, "Give the project a name").max(80),
  techStack: z.string().trim().max(200).default(""),
})

export const moveDateSchema = z.object({
  pathId: idSchema,
  days: z.number().int().min(-365).max(365),
})
