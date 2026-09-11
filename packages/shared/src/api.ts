import { z } from "zod"

/**
 * Every API response is enveloped. Success bodies carry `data`; failures carry
 * `error`. Keeping one shape means the web client has exactly one branch to
 * write, and errors can never be mistaken for a valid payload.
 */
export type ApiSuccess<T> = { data: T }

export type ApiErrorBody = {
  error: {
    code: ApiErrorCode
    message: string
    /** Field-level messages, keyed by path, when a request fails validation. */
    details?: Record<string, string[]>
  }
}

export type ApiResponse<T> = ApiSuccess<T> | ApiErrorBody

export const apiErrorCodes = [
  "BAD_REQUEST",
  "VALIDATION_ERROR",
  "UNAUTHORIZED",
  "FORBIDDEN",
  "NOT_FOUND",
  "CONFLICT",
  "RATE_LIMITED",
  "INTERNAL",
] as const

export type ApiErrorCode = (typeof apiErrorCodes)[number]

export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
})

export type PaginationInput = z.infer<typeof paginationSchema>

export type Paginated<T> = {
  items: T[]
  nextCursor: string | null
}
