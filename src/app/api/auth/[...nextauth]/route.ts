import {handlers} from "@/lib/auth";

export const { GET, POST } = handlers;

/*
* By exporting them directly from the route file, Next.js App Router registers them as HTTP endpoints.

So [...nextauth] becomes a catch-all route that handles:

GET  /api/auth/signin
GET  /api/auth/signout
GET  /api/auth/session
GET  /api/auth/callback/google
POST /api/auth/signin/credentials
*
* */