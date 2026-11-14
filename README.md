# Manzil

A personal growth OS for developers. Name the job you want; Manzil draws the path in small steps and hands you four things a day: one lesson, one interview problem, one spoken concept drill, and one build step.

## Setup

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Create `.env` with:

   | Variable | What it's for |
   |---|---|
   | `DATABASE_URL` | PostgreSQL with the `pgvector` extension (Railway, or `docker compose up` locally on port 5433) |
   | `AUTH_SECRET` | NextAuth secret: `npx auth secret` |
   | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Google sign-in |
   | `ANTHROPIC_API_KEY` | Claude, server side only: drawing paths, splitting steps, writing lessons, drill model answers and the weekly read |

3. Create the tables and load the catalog (75 problems, 36 drill topics, the 65-lesson syllabus). Both commands are safe to re-run:

   ```bash
   pnpm prisma db push
   ```

   ```bash
   pnpm prisma db seed
   ```

4. Run it:

   ```bash
   pnpm dev
   ```

Without `ANTHROPIC_API_KEY` everything except the AI features works; those show "AI isn't set up on this server yet."

## How the product works

- **Today** (`/dashboard`) assembles the day: the next lesson, a drill (most overdue review, else a new topic), a problem (on Sundays, a redo of one you couldn't solve), and the current step of your main path. Each finished item sets a flag on `DayActivity` for the user's local day.
- **Journey** (`/paths`): milestones and steps. Pace comes from the hours of steps completed over the last 28 days; "lands on" and "days behind" come from `src/lib/pace.ts`.
- **New path** (`/paths/new`): seven questions → `POST /api/ai/path-draft` → a `DRAFT` path → "Start this path" makes it the main path.
- **Practice** (`/practice`): the 30-minute problem timer logs to `CodingLog`; drill scores 1–4 schedule the topic back in 1/3/7/14 days (`TopicReview`).
- **Read** (`/library`): one lesson arrives per day from sign-up. A lesson's body is written by Claude the first time anyone opens it, then cached in `Lesson.content`.
- **Progress** (`/progress`): readiness out of 100 (`src/lib/readiness.ts`): problem solving 35, concepts 35, mock interviews 20 (not built yet, always 0), consistency 10.

## Layout

- `src/actions/`: server actions (all mutations; every one checks ownership)
- `src/app/api/ai/`: the Claude routes
- `src/lib/data/`: read queries per page
- `src/lib/ai/`: Claude client and prompts (structured outputs, validated with Zod)
- `src/lib/validations/`: Zod schemas
- `prisma/seed-data.ts`: the problem list, drill topics and syllabus
