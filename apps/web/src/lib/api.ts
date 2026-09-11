import "server-only"
import { cookies } from "next/headers"
import type { ApiErrorBody, ApiErrorCode, ApiSuccess } from "@manzil/shared"

const API_URL = process.env.API_URL ?? "http://localhost:4000"

/**
 * NextAuth names the cookie differently once it is served over HTTPS, so both
 * spellings have to be checked.
 */
const SESSION_COOKIE_NAMES = ["authjs.session-token", "__Secure-authjs.session-token"]

export class ApiError extends Error {
  readonly status: number
  readonly code: ApiErrorCode
  readonly details?: Record<string, string[]>

  constructor(status: number, body: ApiErrorBody["error"]) {
    super(body.message)
    this.name = "ApiError"
    this.status = status
    this.code = body.code
    this.details = body.details
  }

  /** The first field-level message, which is what forms usually want to show. */
  get firstDetail(): string | undefined {
    return this.details ? Object.values(this.details)[0]?.[0] : undefined
  }
}

async function readSessionToken(): Promise<string | null> {
  const store = await cookies()
  for (const name of SESSION_COOKIE_NAMES) {
    const value = store.get(name)?.value
    if (value) return value
  }
  return null
}

async function send<T>(path: string, init: RequestInit, headers: HeadersInit): Promise<T> {
  const response = await fetch(`${API_URL}/api/v1${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...headers },
    // This app is session-driven, so nothing here should be cached by default.
    cache: "no-store",
  })

  if (response.status === 204) return undefined as T

  const body = (await response.json()) as ApiSuccess<T> | ApiErrorBody

  if (!response.ok || "error" in body) {
    const error = "error" in body
      ? body.error
      : { code: "INTERNAL" as ApiErrorCode, message: "Unexpected API response" }
    throw new ApiError(response.status, error)
  }

  return body.data
}

/**
 * Calls the API as the signed-in user. The session token never reaches the
 * browser: it stays in an httpOnly cookie and is forwarded from the server.
 */
export async function apiFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const token = await readSessionToken()
  return send<T>(path, init, token ? { Authorization: `Bearer ${token}` } : {})
}

/**
 * Calls the API's internal endpoints during sign-in, when no session exists
 * yet. Authenticated with the shared service secret instead.
 */
export async function internalApiFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const secret = process.env.INTERNAL_API_SECRET
  if (!secret) throw new Error("INTERNAL_API_SECRET is not set")
  return send<T>(path, init, { "X-Internal-Secret": secret })
}

export const api = {
  get: <T>(path: string) => apiFetch<T>(path, { method: "GET" }),
  post: <T>(path: string, body: unknown) =>
    apiFetch<T>(path, { method: "POST", body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    apiFetch<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T>(path: string) => apiFetch<T>(path, { method: "DELETE" }),
}
