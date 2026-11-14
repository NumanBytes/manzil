import { cache } from "react"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/** The signed-in user for server components and actions. Redirects to /login when signed out. */
export const requireUser = cache(async () => {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      goal: true,
      timezone: true,
      courseStartedAt: true,
      currentRole: true,
      yearsOfExp: true,
      techStack: true,
      learningStyle: true,
      dailyHours: true,
    },
  })
  if (!user) redirect("/login")
  return user
})

export type CurrentUser = Awaited<ReturnType<typeof requireUser>>

/** For server actions and API routes: returns null instead of redirecting. */
export async function currentUserId() {
  const session = await auth()
  return session?.user?.id ?? null
}
