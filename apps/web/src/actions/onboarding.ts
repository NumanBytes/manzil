"use server"

import { onboardingSchema, type CurrentUser, type OnboardingInput } from "@manzil/shared"
import { auth } from "@/lib/auth"
import { ApiError, api } from "@/lib/api"

type OnboardingResult = { success: true } | { success: false; error: string }

export async function completeOnboarding(input: OnboardingInput): Promise<OnboardingResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "You must be signed in to continue" }
  }

  const parsed = onboardingSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  try {
    await api.patch<CurrentUser>("/users/me/onboarding", parsed.data)
  } catch (error) {
    if (error instanceof ApiError) {
      return { success: false, error: error.firstDetail ?? error.message }
    }
    throw error
  }

  return { success: true }
}
