import { z } from "zod"
import { ValidationError } from "./errors"

/** Turns a ZodError into the `details` map the API contract specifies. */
export function toFieldErrors(error: z.ZodError): Record<string, string[]> {
  const details: Record<string, string[]> = {}
  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? issue.path.join(".") : "_"
    ;(details[key] ??= []).push(issue.message)
  }
  return details
}

/**
 * Parses untrusted input and converts a failure into a ValidationError, so
 * controllers can validate inline and still get the standard 422 body.
 */
export function parseOrThrow<S extends z.ZodType>(schema: S, input: unknown): z.infer<S> {
  const result = schema.safeParse(input)
  if (!result.success) throw new ValidationError(toFieldErrors(result.error))
  return result.data
}
