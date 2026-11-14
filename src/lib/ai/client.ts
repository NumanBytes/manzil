import Anthropic from "@anthropic-ai/sdk"
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod"
import type { z } from "zod"

// Server-side only. The key is read from ANTHROPIC_API_KEY and never reaches the client.
export const AI_MODEL = "claude-sonnet-5-5"
// If the model declines a request for policy reasons, the API re-runs it on this model in the same call.
const FALLBACK_MODEL = "claude-sonnet-5"

export class AIUnavailableError extends Error {
  constructor(message = "AI isn't set up on this server yet. Add ANTHROPIC_API_KEY to the environment.") {
    super(message)
  }
}

export class AIFailedError extends Error {}

let client: Anthropic | null = null
function getClient() {
  if (!process.env.ANTHROPIC_API_KEY) throw new AIUnavailableError()
  client ??= new Anthropic()
  return client
}

type Options<S extends z.ZodType> = {
  system: string
  prompt: string
  schema: S
  maxTokens?: number
  effort?: "low" | "medium" | "high"
}

/** One structured-output call: Claude's reply is validated against the Zod schema before it is returned. */
export async function generateStructured<S extends z.ZodType>({
  system,
  prompt,
  schema,
  maxTokens = 16000,
  effort = "medium",
}: Options<S>): Promise<z.infer<S>> {
  let response
  try {
    response = await getClient().beta.messages.parse({
      model: AI_MODEL,
      max_tokens: maxTokens,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: [{ model: FALLBACK_MODEL }],
      system,
      messages: [{ role: "user", content: prompt }],
      output_config: { effort, format: betaZodOutputFormat(schema) },
    })
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) throw new AIUnavailableError("The Anthropic API key on this server was rejected.")
    if (err instanceof Anthropic.RateLimitError) throw new AIFailedError("The AI is busy right now. Try again in a minute.")
    if (err instanceof Anthropic.APIError) throw new AIFailedError(`The AI request failed (${err.status ?? "network"}). Try again.`)
    throw err
  }

  if (response.stop_reason === "refusal") throw new AIFailedError("The AI declined this request. Try rewording your answers.")
  if (response.stop_reason === "max_tokens") throw new AIFailedError("The AI's answer was cut off. Try again.")
  if (!response.parsed_output) throw new AIFailedError("The AI returned something we couldn't read. Try again.")
  return response.parsed_output as z.infer<S>
}

/** Map AI errors to an HTTP response for the /api/ai routes. */
export function aiErrorResponse(err: unknown) {
  if (err instanceof AIUnavailableError) return Response.json({ error: err.message }, { status: 503 })
  if (err instanceof AIFailedError) return Response.json({ error: err.message }, { status: 502 })
  console.error(err)
  return Response.json({ error: "Something went wrong." }, { status: 500 })
}
