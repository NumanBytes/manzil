import type { ApiErrorCode } from "@manzil/shared"

/**
 * Anything thrown as an AppError is a deliberate, client-facing failure: the
 * error handler trusts its message and status. Every other thrown value is
 * treated as a bug and reported as a generic 500.
 */
export class AppError extends Error {
  readonly statusCode: number
  readonly code: ApiErrorCode
  readonly details?: Record<string, string[]>

  constructor(
    statusCode: number,
    code: ApiErrorCode,
    message: string,
    details?: Record<string, string[]>
  ) {
    super(message)
    this.name = new.target.name
    this.statusCode = statusCode
    this.code = code
    this.details = details
    Error.captureStackTrace?.(this, new.target)
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Bad request") {
    super(400, "BAD_REQUEST", message)
  }
}

export class ValidationError extends AppError {
  constructor(details: Record<string, string[]>, message = "Validation failed") {
    super(422, "VALIDATION_ERROR", message, details)
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required") {
    super(401, "UNAUTHORIZED", message)
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You do not have access to this resource") {
    super(403, "FORBIDDEN", message)
  }
}

export class NotFoundError extends AppError {
  constructor(resource = "Resource") {
    super(404, "NOT_FOUND", `${resource} not found`)
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource already exists") {
    super(409, "CONFLICT", message)
  }
}
