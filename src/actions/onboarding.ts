"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { onboardingSchema, type OnboardingInput } from "@/lib/validations/onboarding"

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

  await prisma.user.update({
    where: { id: session.user.id },
    data: { ...parsed.data, onboarded: true },
  })

  return { success: true }
}
