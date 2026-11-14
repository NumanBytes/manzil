import { requireUser } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { AppNav } from "@/components/layout/app-nav"
import { TimezoneSync } from "@/components/layout/timezone-sync"
import { formatDate } from "@/lib/dates"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser()
  const main = await prisma.path.findFirst({
    where: { userId: user.id, isMain: true, status: "ACTIVE" },
    select: { goal: true, targetDate: true },
  })
  const subtitle = main
    ? `${main.goal} by ${formatDate(main.targetDate, { month: "long", year: "numeric" })}`
    : user.goal

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <TimezoneSync saved={user.timezone} />
      <AppNav name={user.name ?? user.email} goal={subtitle} />
      {children}
    </div>
  )
}
