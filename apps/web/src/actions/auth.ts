"use server"

import { signupSchema, type SignupInput, type AuthenticatedUser } from "@manzil/shared"
import { ApiError, internalApiFetch } from "@/lib/api"

type SignupResult = { success: true } | { success: false; error: string }

export async function signup(input: SignupInput): Promise<SignupResult> {
  const parsed = signupSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  const { name, email, password } = parsed.data

  try {
    await internalApiFetch<AuthenticatedUser>("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    })
  } catch (error) {
    if (error instanceof ApiError) {
      // The API already phrases the duplicate-email and validation messages for
      // the user, so pass them straight through.
      return { success: false, error: error.firstDetail ?? error.message }
    }
    throw error
  }

  return { success: true }
}
