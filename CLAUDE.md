@AGENTS.md
# Manzil — Project Context

## What this is
A developer-specific personal growth OS built with Next.js 14, 
TypeScript, PostgreSQL, Prisma, NextAuth.js, Zustand, Zod, 
and Claude API.

## Core modules
- Paths — AI-personalized learning journeys
- Projects — Documented build initiatives  
- Coding Tracker — Manual problem solve logging
- Dashboard — Growth mirror with drift calculation
- Public Profile — Living developer portfolio

## Stack
- Frontend: Next.js 14 App Router + TypeScript
- Styling: Tailwind CSS + shadcn/ui
- Database: PostgreSQL + Prisma ORM
- Vector search: pgvector (via raw SQL migration)
- Auth: NextAuth.js v5 beta
- AI: Claude API (Sonnet) — server side only
- State: Zustand (client only)
- Validation: Zod
- Hosting: Vercel + Railway

## Key conventions
- All database calls happen server side only
- Claude API key never exposed to client
- Server Actions for mutations, API routes for NextAuth + AI
- Zod schemas in src/lib/validations/
- Components organized by module in src/components/
- Route groups: (auth), (dashboard), (public)

## Current status
Schema designed. Folder structure created. 
Next step: Railway database connection + Prisma migration.