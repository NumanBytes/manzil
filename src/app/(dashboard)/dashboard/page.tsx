import Link from "next/link"
import { Trail } from "@/components/shared/trail"
import { PageMain } from "@/components/shared/primitives"
import { TodayBoard } from "@/components/dashboard/today-board"
import { MAIN_PATH, MAIN_STOPS, MANZIL_SENTENCE, MANZIL_TARGET, READINESS } from "@/lib/sample-data"

export default function TodayPage() {
  const now = new Date()
  const today = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long" }).format(now)
  const dayShort = new Intl.DateTimeFormat("en-GB", { weekday: "short" }).format(now)

  return (
    <PageMain>
      <section className="flex flex-col gap-[18px] rounded-card bg-hero px-[18px] pt-[18px] pb-5 text-hero-foreground md:px-8 md:py-6">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <p className="m-0 font-heading text-lg leading-[1.3] font-bold">
            <span className="mr-3 font-sans text-xs font-semibold tracking-[0.08em] text-hero-soft uppercase">Your manzil</span>
            {MANZIL_SENTENCE}
          </p>
          <span className="text-sm text-hero-muted">{MANZIL_TARGET}</span>
        </div>
        <Trail nodes={MAIN_STOPS} plan={MAIN_PATH.planAt} onHero />
        <p className="m-0 text-sm text-hero-muted">
          {MAIN_PATH.walkedPct}% walked. The plan says {Math.round(MAIN_PATH.planAt * 100)}% by today, so you are{" "}
          {MAIN_PATH.daysBehind} days behind: about one extra hour this week closes it.{" "}
          <Link href="/progress" className="text-hero-foreground underline">
            Interview readiness {READINESS.score} of 100
          </Link>
        </p>
      </section>

      <TodayBoard dateLabel={today} dayShort={dayShort} />
    </PageMain>
  )
}
