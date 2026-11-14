import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { Eyebrow, PageHeading, PageMain } from "@/components/shared/primitives"
import { JourneyBoard } from "@/components/paths/journey-board"
import { PathProjects } from "@/components/paths/path-projects"
import { MAIN_PATH } from "@/lib/sample-data"

export default function JourneyPage() {
  return (
    <PageMain className="md:gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1.5">
          <Eyebrow>
            Your main path · {MAIN_PATH.walkedPct}% walked · lands {MAIN_PATH.landsOn}
          </Eyebrow>
          <PageHeading>{MAIN_PATH.title}</PageHeading>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Link href="/paths" className={buttonVariants({ variant: "outline" })}>
            All paths ({MAIN_PATH.pathCount})
          </Link>
          <Link href="/paths/new" className={buttonVariants()}>
            New path
          </Link>
        </div>
      </div>

      <JourneyBoard aside={<PathProjects />} />
    </PageMain>
  )
}
