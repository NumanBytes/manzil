/**
 * Sample content for the signed-in pages until paths, drills, lessons and logs are
 * wired to Prisma. Lesson titles, drill topics and problem names are real; the
 * percentages, dates and scores are placeholders the app will compute.
 */
import type { TrailNode } from "@/components/shared/trail"

export const MANZIL_SENTENCE = "An AI-native product engineer who leads in the agentic era"
export const MANZIL_TARGET = "Full Stack Engineer by April 2027"

export const MAIN_PATH = {
  title: "Senior Full Stack: Next.js + Nest.js + PostgreSQL",
  walkedPct: 38,
  planAt: 0.42,
  landsOn: "4 May 2027",
  target: "30 April",
  daysBehind: 4,
  pacePerWeek: "5.5 h",
  paceNeeded: "6.5 h",
  pathCount: 2,
}

export const MAIN_STOPS: TrailNode[] = [
  { label: "NestJS foundations", state: "done" },
  { label: "PostgreSQL and Prisma", state: "here" },
  { label: "Auth and security", state: "ahead" },
  { label: "Docker and AWS", state: "ahead" },
  { label: "Full Stack Engineer", state: "ahead" },
]

export const READINESS = {
  score: 41,
  band: "Building",
  delta: "up 6 since last Saturday",
  parts: [
    { name: "Problem solving", note: "2 alone, 4 with a hint, of 120", score: 14, max: 35 },
    { name: "Concepts", note: "18 of 67 drilled; drilled once counts less than scored 3 or 4", score: 18, max: 35 },
    { name: "Mock interviews", note: "none yet; the first unlocks after 3 more drills", score: 0, max: 20 },
    { name: "Consistency", note: "active 12 of the last 14 days", score: 9, max: 10 },
  ],
}

/* ---------- Today ---------- */

export type TodayStep = {
  key: string
  title: string
  meta: string
  time: string
  minutes: number
  href: string
}

export const TODAY_FOCUS = {
  eyebrow: "Do this now · 15 min",
  title: "Drill: Closures",
  prompt:
    "Explain what a closure is. Then say why a loop with var and setTimeout prints the same number each time, and give two fixes.",
  explainer:
    "A drill is a 15-minute spoken answer to one concept question, with no notes. Afterwards you score yourself 1 to 4, and Manzil decides when the topic comes back.",
  meta: "JavaScript · new topic",
  minutes: 15,
}

export const TODAY_STEPS: TodayStep[] = [
  { key: "lesson", title: "Read Lesson 14: Closures", meta: "JavaScript under the hood", time: "5 min", minutes: 5, href: "/library" },
  { key: "solve", title: "Solve problem 7: Contains Duplicate", meta: "One problem a day, AI off", time: "30 min", minutes: 30, href: "/practice" },
  { key: "build", title: "Build: write a Prisma schema for users and sessions", meta: "Senior Full Stack path · PostgreSQL and Prisma", time: "60 min", minutes: 60, href: "/paths" },
]

/** Steps done on each of the last six days (Sun–Fri). Today is computed live. */
export const LAST_SIX_DAYS = [
  { day: "Sun", count: 4 },
  { day: "Mon", count: 3 },
  { day: "Tue", count: 4 },
  { day: "Wed", count: 2 },
  { day: "Thu", count: 4 },
  { day: "Fri", count: 3 },
]

export const TOMORROW = [
  "Lesson 15: How this works · Drill: The event loop (review, you scored it 1) · Problem 8: Valid Anagram · one path step.",
  "Sunday is also redo day: one problem you couldn't solve comes back.",
]

/* ---------- Journey ---------- */

export type MilestoneStep = { kind: "Learn" | "Build" | "Prove"; title: string; time: string; status: "done" | "here" | "ahead" }
export type Milestone = { title: string; meta: string; steps: MilestoneStep[] }

const s = (kind: MilestoneStep["kind"], title: string, time: string, status: MilestoneStep["status"] = "ahead"): MilestoneStep => ({ kind, title, time, status })

export const MILESTONES: Milestone[] = [
  {
    title: "NestJS foundations",
    meta: "8 of 8 steps · 11 h · done 2 Nov",
    steps: [
      s("Learn", "Read how Nest modules, controllers and providers fit together", "1 h", "done"),
      s("Build", "Scaffold a Nest app with one module and a health route", "1 h", "done"),
      s("Build", "Add a users controller with DTO validation", "1.5 h", "done"),
      s("Learn", "Dependency injection explained with your own provider", "1 h", "done"),
      s("Build", "Guards and interceptors on the users route", "1.5 h", "done"),
      s("Build", "Config module with env validation", "1 h", "done"),
      s("Learn", "Request lifecycle, in order, from memory", "1 h", "done"),
      s("Prove", "Timed: rebuild the module from a blank folder in 45 minutes", "1 h", "done"),
    ],
  },
  {
    title: "PostgreSQL and Prisma",
    meta: "3 of 7 steps · 9.5 h · the plan has you at step 5 today",
    steps: [
      s("Learn", "Model users and sessions on paper", "30 min", "done"),
      s("Build", "Install Prisma and connect to local PostgreSQL", "1 h", "done"),
      s("Build", "Write the first migration and seed two users", "1 h", "done"),
      s("Build", "Write a Prisma schema for users and sessions", "1 h", "here"),
      s("Build", "Add a repository layer with typed queries", "1.5 h"),
      s("Learn", "Read one query plan with EXPLAIN ANALYZE", "1 h"),
      s("Prove", "Timed write-up of your schema choices", "1 h"),
    ],
  },
  {
    title: "Auth and security",
    meta: "0 of 6 steps · 8 h",
    steps: [
      s("Learn", "Sessions against JWT: pick one for Manzil and say why", "1 h"),
      s("Build", "Hash passwords with argon2 and store them", "1 h"),
      s("Build", "Access and refresh tokens with httpOnly cookies", "1.5 h"),
      s("Build", "Guards for roles on two routes", "1 h"),
      s("Learn", "OWASP top 10, mapped to your own routes", "1.5 h"),
      s("Prove", "Attack your own login: three attempts, written up", "2 h"),
    ],
  },
  {
    title: "Docker and AWS deploy",
    meta: "0 of 7 steps · 10 h",
    steps: [
      s("Learn", "Images, layers and why multi-stage builds are small", "1 h"),
      s("Build", "Dockerfile for the Nest API", "1 h"),
      s("Build", "Compose with PostgreSQL and a volume", "1.5 h"),
      s("Build", "GitHub Actions: test, build, push the image", "1.5 h"),
      s("Build", "EC2 with Nginx in front, HTTPS on", "2 h"),
      s("Learn", "Logs and a health check you can actually read", "1 h"),
      s("Prove", "Deploy from a clean clone in under 30 minutes", "2 h"),
    ],
  },
  {
    title: "System design",
    meta: "0 of 6 steps · 9 h",
    steps: [
      s("Learn", "A framework for any design question", "1 h"),
      s("Learn", "Caching layers, from browser to database", "1 h"),
      s("Build", "Add Redis cache-aside to one hot endpoint", "1.5 h"),
      s("Learn", "Queues, retries and idempotent workers", "1.5 h"),
      s("Build", "Move one slow job to BullMQ", "2 h"),
      s("Prove", "Design a notification system out loud, 30 minutes", "2 h"),
    ],
  },
]

export const CURRENT_MILESTONE = 1

export const CURRENT_STEP_DETAIL = {
  subtasks: [
    { text: "Sketch the two tables and the relation on paper", min: 10 },
    { text: "Write model User and model Session in schema.prisma", min: 15 },
    { text: "Run prisma migrate dev and read the SQL it generated", min: 15 },
    { text: "Write seed.ts for two users with one session each", min: 20 },
  ],
  doneLooksLike:
    "prisma migrate dev runs clean, and a seed script inserts two users with sessions you can query in psql.",
  use: "Prisma docs, Data model and Relations pages. Your Shortlist schema as a reference for naming.",
}

export const PATH_PROJECTS = [
  { name: "Shortlist", status: "live" as const, meta: "NestJS, PostgreSQL, Docker, AWS EC2 · 31 h logged" },
  { name: "Manzil", status: "building now" as const, meta: "Next.js, Prisma, PostgreSQL, Claude API · 18 h logged" },
]

/* ---------- Practice ---------- */

export const PROBLEM = {
  number: 7,
  total: 120,
  title: "Contains Duplicate",
  source: "LeetCode 217 · arrays and hashing",
  url: "https://leetcode.com/problems/contains-duplicate/",
  next: "Valid Anagram",
}

export const DRILL = {
  topic: "Closures",
  track: "JavaScript",
  prompt: TODAY_FOCUS.prompt,
  modelAnswer: [
    { lead: "A closure", rest: "is a function plus the variables that were in scope when it was created; it keeps them alive after the outer function returns." },
    { lead: "The loop", rest: "prints the same number because var makes one shared variable; every callback reads it after the loop has finished." },
    { lead: "Two fixes:", rest: "use let so each iteration gets its own binding, or wrap the body in an IIFE that captures the current value." },
  ],
}

export const TOPIC_TRACKS = [
  { name: "JavaScript", drilled: 5, total: 12, level: 2 },
  { name: "React", drilled: 4, total: 14, level: 2 },
  { name: "TypeScript", drilled: 1, total: 6, level: 1 },
  { name: "SQL and databases", drilled: 2, total: 9, level: 1 },
  { name: "Node and backend", drilled: 2, total: 11, level: 2 },
  { name: "Your CV", drilled: 3, total: 8, level: 2 },
  { name: "System design", drilled: 1, total: 7, level: 1 },
]

export const WEAK_SPOTS = [
  { topic: "The event loop", note: "Scored 1 · back tomorrow", action: { kind: "link" as const, label: "Reread Lesson 20", href: "/library" } },
  { topic: "Your GraphQL work", note: "Scored 2 · back in 3 days", action: { kind: "drill" as const, label: "Drill now" } },
]

export const MOCK_STOPS: TrailNode[] = [
  { label: "", state: "done" },
  { label: "", state: "done" },
  { label: "", state: "here" },
  { label: "", state: "ahead" },
  { label: "", state: "ahead" },
  { label: "Mock 1", state: "ahead" },
]

/* ---------- Read ---------- */

export const COURSE = {
  title: "Full-Stack + AI Engineering Course",
  current: 14,
  total: 240,
  read: 13,
  arrives: "7:37",
}

export const LESSONS = [
  { n: 11, title: "How JavaScript runs", status: "read" },
  { n: 12, title: "Execution context and the call stack", status: "read" },
  { n: 13, title: "Scope, hoisting and the TDZ", status: "read" },
  { n: 14, title: "Closures", status: "today" },
  { n: 15, title: "How this works", status: "tonight" },
  { n: 16, title: "Values vs references", status: "" },
  { n: 17, title: "Prototypes and classes", status: "" },
  { n: 18, title: "Single-threaded: one thing at a time", status: "" },
] as const

/* ---------- Progress ---------- */

export const READINESS_SCALE: TrailNode[] = [
  { label: "0 · Early days", state: "done" },
  { label: "25 · Building", state: "done" },
  { label: "41 · you", state: "here" },
  { label: "50 · Interview-capable", state: "ahead" },
  { label: "75 · Ready", state: "ahead" },
  { label: "100", state: "ahead" },
]

export const WEEKLY_READ = {
  body: "You read every lesson and solved six problems, but only two without a hint. The path slipped four days because the build step kept losing to reading.",
  change: "on weekdays, do the path step before the lesson.",
}

/** 0 = nothing, 1 = part of the day, 2 = all four steps. Oldest first, last item is today. */
export const LAST_28_DAYS = [2, 1, 2, 0, 2, 2, 1, 1, 2, 0, 0, 2, 2, 1, 2, 1, 2, 2, 0, 2, 2, 1, 2, 1, 0, 2, 1, 1]
