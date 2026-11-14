import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { AppNav } from "@/components/layout/app-nav"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  const user = session?.user?.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { name: true, goal: true },
      })
    : null

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <AppNav name={user?.name ?? session?.user?.name ?? "You"} goal={user?.goal} />
      {children}
    </div>
  )
}
