import type { ErrorRequestHandler, RequestHandler } from "express"
import { z } from "zod"
import { Prisma } from "@manzil/db"
import type { ApiErrorBody } from "@manzil/shared"
import { AppError, NotFoundError } from "../lib/errors"
import { toFieldErrors } from "../lib/zod"
import { logger } from "../lib/logger"
import { isProduction } from "../env"

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new NotFoundError(`Route ${req.method} ${req.path}`))
}

/**
 * The single place that turns a thrown value into an HTTP response. Express 5
 * forwards rejected promises from async handlers here automatically, which is
 * why no route needs a try/catch or an asyncHandler wrapper.
 */
export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const normalized = normalize(err)

  if (normalized.statusCode >= 500) {
    logger.error({ err, path: req.path, method: req.method }, "Unhandled request error")
  } else {
    logger.warn(
      { code: normalized.code, path: req.path, method: req.method, message: normalized.message },
      "Request failed"
    )
  }

  const body: ApiErrorBody = {
    error: {
      code: normalized.code,
      message: normalized.message,
      ...(normalized.details ? { details: normalized.details } : {}),
    },
  }

  res.status(normalized.statusCode).json(body)
}

function normalize(err: unknown): AppError {
  if (err instanceof AppError) return err

  // Controllers validate inline, so a raw ZodError reaching here is still a
  // client error, not a bug.
  if (err instanceof z.ZodError) {
    return new AppError(422, "VALIDATION_ERROR", "Validation failed", toFieldErrors(err))
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      const target = (err.meta?.["target"] as string[] | undefined)?.join(", ")
      return new AppError(
        409,
        "CONFLICT",
        target ? `A record with that ${target} already exists` : "Record already exists"
      )
    }
    if (err.code === "P2025") {
      return new AppError(404, "NOT_FOUND", "Record not found")
    }
  }

  // Anything else is a bug. Never leak its message to the client in production.
  return new AppError(
    500,
    "INTERNAL",
    isProduction
      ? "Something went wrong"
      : err instanceof Error
        ? err.message
        : "Unknown error"
  )
}
