# Manzil

A developer-specific personal growth OS — track learning paths, projects and
coding consistency, and make the gap between your current and desired skill
level visible.

Built as a multi-stack system: a **Next.js** frontend and a separate
**Node/Express** backend.

## Architecture

```
apps/web  ──HTTP──>  apps/api  ──Prisma──>  Postgres (pgvector)
(Next.js)            (Express)
 Vercel               Railway               Railway
```

The Express API owns every database read and write. The web app holds no Prisma
import at all — it renders UI and calls the API from server-side code, which
keeps the session token in an httpOnly cookie and never exposes it to the
browser.

| Package            | What it is                                              |
| ------------------ | ------------------------------------------------------- |
| `apps/web`         | Next.js 16 app — UI, SSR, NextAuth sign-in              |
| `apps/api`         | Express 5 REST API — business logic, all data access     |
| `packages/db`      | Prisma schema and the shared, generated client           |
| `packages/shared`  | Zod schemas and types both services import               |

### How auth works across two services

NextAuth signs a session token in the web app; the API verifies it. By default
Auth.js *encrypts* the session token (JWE), which only Auth.js can open, so
`apps/web/src/lib/auth.jwt.ts` overrides `jwt.encode`/`decode` to sign a plain
HS256 JWT instead. Both services hold the same `AUTH_SECRET`.

The two `/auth` endpoints that run *before* a session exists — the credentials
check and the Google account upsert — are server-to-server only and are gated on
a separate shared `INTERNAL_API_SECRET`.

## Getting started

**Prerequisites:** Node.js 20.9+, pnpm 12, and Docker (or any Postgres with the
`pgvector` extension).

```bash
pnpm install
cp .env.example .env
```

Fill in `.env`. Generate the two secrets with:

```bash
openssl rand -base64 32     # once for AUTH_SECRET, once for INTERNAL_API_SECRET
```

Start the database, push the schema, and run both services:

```bash
pnpm docker:up      # Postgres + pgvector on port 5433
pnpm db:generate    # generate the Prisma client
pnpm db:push        # create the tables
pnpm dev            # web on :3000, api on :4000
```

The database only needs `pgvector` for the RAG features; everything else works
without it.

## Commands

| Command           | What it does                                  |
| ----------------- | --------------------------------------------- |
| `pnpm dev`        | Run both services                             |
| `pnpm dev:web`    | Next.js only, on :3000                        |
| `pnpm dev:api`    | Express only, on :4000                        |
| `pnpm build`      | Generate the Prisma client, then build both   |
| `pnpm typecheck`  | Typecheck all four packages                   |
| `pnpm lint`       | Lint both apps                                |
| `pnpm db:push`    | Push the schema to the database               |
| `pnpm db:studio`  | Open Prisma Studio                            |
| `pnpm docker:up`  | Start local Postgres                          |

## Environment

Local development reads a single `.env` at the repo root — `packages/db`,
`apps/api` and `apps/web` each load it explicitly. In production each host
injects its own variables and no `.env` file is read.

`AUTH_SECRET` and `INTERNAL_API_SECRET` **must be identical** in both
deployments, or the API will reject every session.

## API

All routes are under `/api/v1`. Responses are enveloped as `{ "data": ... }` on
success and `{ "error": { "code", "message", "details?" } }` on failure.

| Method | Route                       | Auth            |
| ------ | --------------------------- | --------------- |
| GET    | `/health`                   | public          |
| POST   | `/auth/signup`              | public, rate-limited |
| POST   | `/auth/verify-credentials`  | service secret  |
| POST   | `/auth/oauth-upsert`        | service secret  |
| GET    | `/users/me`                 | session         |
| PATCH  | `/users/me/onboarding`      | session         |
| GET    | `/paths`                    | session         |
| POST   | `/paths`                    | session         |
| GET    | `/paths/:id`                | session         |
| PATCH  | `/paths/:id`                | session         |
| DELETE | `/paths/:id`                | session         |

`paths` is the reference module. The remaining domains in the schema — projects,
coding logs, notes, weekly reports and the AI/RAG endpoints — follow the same
`*.routes.ts` + `*.service.ts` shape.

## Deployment

- **apps/web → Vercel.** Set the project root directory to `apps/web`.
- **apps/api → Railway.** Build with `pnpm --filter @manzil/api build`, start
  with `pnpm --filter @manzil/api start`. Set `WEB_ORIGIN` to the deployed web
  URL and `API_URL` on Vercel to the deployed API URL.
