# Manzil — Project Context

## What this is

A developer-specific personal growth OS. The developer (Numan)
is building this to track learning paths, projects, coding
consistency, and make the gap between current and desired skill
level visible and motivating.

## Current status

- Schema designed and pushed to Railway PostgreSQL
- Folder structure created
- NextAuth v5 configured with credentials + Google OAuth
- Middleware created with Edge Runtime split
- Login page built
- Currently debugging: Prisma 7 + Next.js Edge Runtime conflict

## Active problem to solve first

Prisma 7 requires driver adapters and custom output path.
Getting `@prisma/client-runtime-utils` module not found error.
Need to fix prisma.ts, next.config.ts, and schema.prisma
for full Prisma 7 compatibility.

## Stack

- Next.js 14 + TypeScript (App Router)
- Tailwind CSS + shadcn/ui
- PostgreSQL on Railway + Prisma 7 ORM
- pgvector for RAG embeddings
- NextAuth.js v5 beta
- Claude API (Sonnet) — server side only
- Zustand (client state)
- Zod (validation)
- Vercel (hosting) + Railway (database)

## Key conventions

- Claude API key never exposed to client
- Server Actions for mutations
- API routes for NextAuth + AI only
- Zod schemas in src/lib/validations/
- Route groups: (auth), (dashboard), (public)
- Auth split: auth.config.ts (Edge safe) + auth.ts (Node.js)

## Prisma 7 specifics

- Provider: prisma-client (not prisma-client-js)
- Output: ../src/generated/prisma (required in v7)
- Requires driver adapter: @prisma/adapter-pg
- Import: from "../generated/prisma/client"
- PrismaClient must be instantiated with adapter

## Database

- PostgreSQL on Railway
- pgvector extension installed manually
- All tables created via prisma db push

## Folder structure

src/
app/
(auth)/login, signup
(dashboard)/dashboard, paths, projects, coding, notes
(public)/[username]
api/auth/[...nextauth], paths, projects, coding, ai
onboarding/
components/layout, dashboard, paths, projects, coding, shared, ui
lib/prisma.ts, auth.ts, auth.config.ts, validations/
hooks/, store/, types/, actions/
prisma/schema.prisma, seed.ts
