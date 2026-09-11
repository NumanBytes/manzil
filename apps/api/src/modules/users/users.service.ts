import { prisma } from "@manzil/db"
import type { CurrentUser, OnboardingInput } from "@manzil/shared"
import { NotFoundError } from "../../lib/errors"

const currentUserSelect = {
  id: true,
  name: true,
  email: true,
  image: true,
  onboarded: true,
  currentRole: true,
  yearsOfExp: true,
  techStack: true,
  goal: true,
  learningStyle: true,
  dailyHours: true,
} as const

export async function getCurrentUser(userId: string): Promise<CurrentUser> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: currentUserSelect,
  })

  // The token verified, but the row is gone — a deleted account still holding
  // a live session.
  if (!user) throw new NotFoundError("User")

  return user
}

export async function completeOnboarding(
  userId: string,
  input: OnboardingInput
): Promise<CurrentUser> {
  return prisma.user.update({
    where: { id: userId },
    data: { ...input, onboarded: true },
    select: currentUserSelect,
  })
}
