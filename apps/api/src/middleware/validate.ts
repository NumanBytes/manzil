import type { RequestHandler } from "express"
import type { z } from "zod"
import { ValidationError } from "../lib/errors"
import { toFieldErrors } from "../lib/zod"

/**
 * Validates and replaces the request body before the controller runs, so a
 * handler typed against the schema can trust what it receives.
 *
 * Only the body is handled here: in Express 5 `req.query` is a getter with no
 * setter, so query strings are parsed inline in controllers with
 * `parseOrThrow` instead.
 */
export function validateBody<S extends z.ZodType>(schema: S): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      return next(new ValidationError(toFieldErrors(result.error)))
    }
    req.body = result.data
    next()
  }
}
