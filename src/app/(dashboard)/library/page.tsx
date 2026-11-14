import Link from "next/link"
import { requireUser } from "@/lib/session"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardTitle, Eyebrow, PageHeading, PageMain } from "@/components/shared/primitives"
import { RevealAnswer } from "@/components/library/reveal-answer"
import { LessonLoader } from "@/components/library/lesson-loader"
import { MarkReadButton } from "@/components/library/mark-read-button"
import { getLibrary } from "@/lib/data/library"
import { cn } from "@/lib/utils"

const prose = "m-0 max-w-[68ch] text-[17px] leading-[1.65]"
const h2 = "m-0 mt-2.5 font-heading text-[22px] font-bold"

const TAG: Record<string, string> = { read: "read", today: "today", open: "", tomorrow: "tomorrow", locked: "" }

export default async function LibraryPage({ searchParams }: { searchParams: Promise<{ n?: string }> }) {
  const user = await requireUser()
  const { n } = await searchParams
  const lib = await getLibrary(user.id, user, n ? Number(n) : undefined)
  const sel = lib.selected
  const pct = lib.total ? ((lib.unlocked / lib.total) * 100).toFixed(1) : "0"

  // Show the module of the selected lesson open, the rest collapsed.
  const openModule = lib.modules.find((m) => m.lessons.some((l) => l.number === sel?.number))?.name

  return (
    <PageMain className="flex-col flex-nowrap items-stretch md:flex-row md:flex-wrap md:items-start">
      <Card as="aside" className="min-w-0 flex-[1_1_300px] gap-1 p-[22px]">
        <CardTitle>The course</CardTitle>
        <p className="mx-0 mt-0.5 mb-2.5 text-sm text-muted-foreground">
          {lib.unlocked} of {lib.total} lessons arrived · {lib.readCount} read · one more arrives each day
        </p>
        <div role="img" aria-label={`${lib.unlocked} of ${lib.total} lessons arrived`} className="relative mb-4 h-2.5">
          <div className="absolute inset-x-0 top-1 border-t-2 border-dashed border-ahead" />
          <div className="absolute left-0 top-1 border-t-2 border-fill" style={{ width: `${pct}%` }} />
          <span
            className="absolute top-0 -ml-[5px] size-2.5 rounded-full bg-pin shadow-[0_0_0_4px_var(--pin-soft)]"
            style={{ left: `${pct}%` }}
          />
        </div>
        {lib.modules.map((m) => {
          const readAll = m.lessons.every((l) => l.status === "read")
          const anyOpen = m.lessons.some((l) => l.status !== "locked" && l.status !== "tomorrow")
          return (
            <details key={m.name} open={m.name === openModule} className="group">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 rounded-lg px-2.5 [&::-webkit-details-marker]:hidden">
                <span className="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">{m.name}</span>
                <span className="text-[13px] text-muted-foreground">
                  {readAll ? "all read" : anyOpen ? `${m.lessons.filter((l) => l.status === "read").length}/${m.lessons.length}` : "later"}
                </span>
              </summary>
              {m.lessons.map((l) => {
                const current = l.number === sel?.number
                const reachable = l.status !== "locked" && l.status !== "tomorrow"
                const inner = (
                  <>
                    <span className="w-[26px] flex-none text-sm text-muted-foreground">{l.number}</span>
                    <span className={cn("min-w-0 flex-1", current ? "font-bold" : "font-medium")}>{l.title}</span>
                    <span className={cn("flex-none text-[13px] font-semibold", l.status === "today" ? "text-pin-ink" : "text-muted-foreground")}>
                      {TAG[l.status]}
                    </span>
                  </>
                )
                const cls = cn(
                  "flex min-h-12 items-center gap-3 rounded-lg border-2 px-2.5 py-1 no-underline",
                  current ? "border-pin bg-card" : "border-transparent",
                  reachable ? "text-foreground hover:bg-muted" : "text-muted-foreground"
                )
                return reachable ? (
                  <Link key={l.number} href={`/library?n=${l.number}`} aria-current={current ? "page" : undefined} className={cls}>
                    {inner}
                  </Link>
                ) : (
                  <div key={l.number} className={cls}>
                    {inner}
                  </div>
                )
              })}
            </details>
          )
        })}
      </Card>

      {sel ? (
        <Card as="article" id="lesson" className="min-w-0 flex-[999_1_560px] gap-[18px] p-[18px] md:px-11 md:py-10">
          <Eyebrow>
            Lesson {sel.number} · {sel.module} · 5 min read
          </Eyebrow>
          <PageHeading>{sel.title}</PageHeading>

          {sel.content ? (
            <>
              <p className="m-0 max-w-[62ch] text-[19px] leading-[1.55] text-body">{sel.content.intro}</p>
              {sel.content.buildsOn && (
                <div className="flex max-w-[68ch] flex-col gap-1.5 rounded-lg bg-muted px-5 py-4">
                  <span className="font-semibold">Builds on</span>
                  <span className="text-body">{sel.content.buildsOn}</span>
                </div>
              )}
              <h2 className={h2}>The big idea</h2>
              {sel.content.bigIdea.map((p, i) => (
                <p key={i} className={prose}>
                  {p}
                </p>
              ))}
              {sel.content.code && (
                <>
                  <h2 className={h2}>See it in code</h2>
                  <pre
                    aria-label={`${sel.content.codeLanguage || "code"} example`}
                    className="m-0 overflow-x-auto rounded-lg bg-[#101828] px-[22px] py-5 font-mono text-sm leading-[1.6] text-[#F2F4F7]"
                  >
                    {sel.content.code}
                  </pre>
                  {sel.content.afterCode && <p className={prose}>{sel.content.afterCode}</p>}
                </>
              )}
              <h2 className={h2}>Interview question</h2>
              <div className="flex max-w-[68ch] flex-col gap-2.5 rounded-lg border border-border px-5 py-4">
                <span className="font-semibold">{sel.content.interviewQuestion}</span>
                <RevealAnswer key={sel.number}>{sel.content.interviewAnswer}</RevealAnswer>
              </div>
              <p className="m-0 text-xs text-muted-foreground">Lesson written by AI. If something here disagrees with the official docs, trust the docs.</p>
            </>
          ) : (
            <LessonLoader number={sel.number} />
          )}

          <div className="mt-1.5 flex flex-wrap items-center gap-3 border-t border-border pt-3.5">
            <MarkReadButton lessonId={sel.id} isRead={sel.isRead} disabled={!sel.content} />
            <Link href="/practice" className={buttonVariants({ variant: "outline", size: "lg" })}>
              Go to today&apos;s drill
            </Link>
            {lib.next && (
              <span className="ml-auto text-sm text-muted-foreground">
                Next: Lesson {lib.next.number}, {lib.next.title}
                {lib.next.number > lib.unlocked ? " · arrives tomorrow" : ""}
              </span>
            )}
          </div>
        </Card>
      ) : (
        <Card className="min-w-0 flex-[999_1_560px] gap-3 p-[18px] md:p-10">
          <PageHeading>No lessons yet.</PageHeading>
          <p className="m-0 text-muted-foreground">Run the database seed to load the course syllabus.</p>
        </Card>
      )}
    </PageMain>
  )
}
