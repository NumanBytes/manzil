# Manzil — Project Context

## What this is

A developer-specific personal growth OS. The developer (Numan)
is building this to track learning paths, projects, coding
consistency, and make the gap between current and desired skill
level visible and motivating.

It is deliberately built as a multi-stack system: a Next.js
frontend and a separate Node/Express backend, so the project
doubles as practice across both halves of the stack.

## Current status

- pnpm monorepo: apps/web (Next.js), apps/api (Express),
  packages/db (Prisma), packages/shared (Zod contracts)
- Express API owns all database access; the web app holds no
  Prisma import
- Auth working end to end: NextAuth issues a signed HS256 session
  token, the API verifies it with the shared AUTH_SECRET
- Migrated to the API: signup, credential verification, Google
  OAuth upsert, onboarding
- `paths` implemented as the reference CRUD module
- Still to build: projects, coding logs, notes, weekly reports,
  AI/RAG endpoints, and the dashboard UI

## Stack

- Next.js 16 + TypeScript (App Router) — UI and SSR only
- Node.js + Express 5 — all business logic and data access
- Tailwind CSS + shadcn/ui
- PostgreSQL on Railway + Prisma 7 ORM
- pgvector for RAG embeddings
- NextAuth.js v5 beta (identity provider in the web app)
- Claude API (Sonnet) — from the Express API only
- Zustand (client state)
- Zod (validation, shared between both services)
- Vercel (web) + Railway (api + database)

## Architecture

    apps/web  ──HTTP──>  apps/api  ──Prisma──>  Postgres
    (Next.js)            (Express)

- The browser never calls the API directly. Web server code
  (Server Actions, Server Components) calls it and forwards the
  session, so the token stays in an httpOnly cookie.
- `apps/web/src/lib/api.ts` is the only place the web app talks
  to the API. `apiFetch` sends the user's session;
  `internalApiFetch` sends the service secret for the /auth
  endpoints that run before a session exists.
- Auth token bridge: NextAuth's default session token is
  encrypted (JWE) and unreadable by other services, so
  `apps/web/src/lib/auth.jwt.ts` overrides `jwt.encode/decode` to
  sign a plain HS256 JWT instead. `apps/api/src/lib/auth-token.ts`
  verifies it. Claims (issuer `manzil-web`, audience `manzil-api`)
  must stay in step across those two files.

## Key conventions

- Claude API key and database credentials live only in apps/api
- The web app must never import Prisma or @manzil/db
- Mutations from the UI go through Server Actions, which call the
  API — never fetch the API from a client component
- Express 5 forwards async errors automatically; no try/catch or
  asyncHandler in routes. Throw an AppError subclass from
  apps/api/src/lib/errors.ts and let the central handler respond
- Every API response is enveloped: `{ data }` or `{ error }`
- Zod schemas shared by both services live in packages/shared;
  request-body validation uses the `validateBody` middleware,
  query and params are parsed inline with `parseOrThrow`
  (Express 5 makes `req.query` read-only)
- Ownership is enforced by scoping queries with `userId`, not by
  checking after the fetch
- API modules follow `<name>.routes.ts` + `<name>.service.ts`;
  routes handle HTTP, services handle data
- Route groups in web: (auth), (dashboard), (public)
- Auth split: auth.config.ts (Edge safe) + auth.ts (Node.js)

## Environment

One `.env` at the repo root is the source of truth locally; see
`.env.example`. `packages/db/prisma.config.ts`,
`apps/api/src/load-env.ts` and `apps/web/next.config.ts` each
load it explicitly. In production both hosts inject real
variables and no .env is read.

`AUTH_SECRET` and `INTERNAL_API_SECRET` must be identical in the
web and api deployments.

Note: `apps/api/src/load-env.ts` is intentionally synchronous.
Top-level `await` there makes it an async module, and sibling
imports then evaluate before it finishes — which silently breaks
env validation under tsx while still working when bundled.

## Database

- PostgreSQL on Railway; docker-compose.yml runs a local
  pgvector instance on port 5433
- pgvector extension installed manually
- Schema and client live in packages/db; the client is generated
  to packages/db/src/generated (gitignored)
- Run `pnpm db:generate` after changing the schema

## Folder structure

    apps/
      web/src/
        app/ (auth)/login, signup
             (dashboard)/dashboard, paths, projects, coding, notes
             (public)/[username]
             api/auth/[...nextauth]
             onboarding/
        components/layout, dashboard, paths, projects, coding, shared, ui
        lib/api.ts, auth.ts, auth.config.ts, auth.jwt.ts
        actions/, hooks/, store/, types/
        proxy.ts
      api/src/
        index.ts, app.ts, env.ts, routes.ts, load-env.ts
        lib/errors.ts, auth-token.ts, logger.ts, request.ts, zod.ts
        middleware/require-auth.ts, validate.ts, error-handler.ts
        modules/auth/, users/, paths/
    packages/
      db/prisma/schema.prisma, src/index.ts
      shared/src/api.ts, auth.ts, onboarding.ts, path.ts, user.ts

## Commands

    pnpm dev           both services
    pnpm dev:web       Next.js only (port 3000)
    pnpm dev:api       Express only (port 4000)
    pnpm build         generate client, then build both
    pnpm typecheck     all four packages
    pnpm lint          both apps
    pnpm db:push       push schema to the database
    pnpm docker:up     local Postgres with pgvector
