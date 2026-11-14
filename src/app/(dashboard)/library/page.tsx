import Link from "next/link"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardTitle, Eyebrow, PageHeading, PageMain } from "@/components/shared/primitives"
import { RevealAnswer } from "@/components/library/reveal-answer"
import { COURSE, LESSONS } from "@/lib/sample-data"
import { cn } from "@/lib/utils"

const prose = "m-0 max-w-[68ch] text-[17px] leading-[1.65]"
const h2 = "m-0 mt-2.5 font-heading text-[22px] font-bold"

export default function LibraryPage() {
  const pct = ((COURSE.current / COURSE.total) * 100).toFixed(1)

  return (
    <PageMain className="flex-col flex-nowrap items-stretch md:flex-row md:flex-wrap md:items-start">
      <Card as="aside" className="min-w-0 flex-[1_1_300px] gap-1 p-[22px]">
        <CardTitle>{COURSE.title}</CardTitle>
        <p className="mx-0 mt-0.5 mb-2.5 text-sm text-muted-foreground">
          Lesson {COURSE.current} of {COURSE.total} · {COURSE.read} read · one arrives every evening at {COURSE.arrives}
        </p>
        <div role="img" aria-label={`${COURSE.current} of ${COURSE.total} lessons`} className="relative mb-4 h-2.5">
          <div className="absolute inset-x-0 top-1 border-t-2 border-dashed border-ahead" />
          <div className="absolute left-0 top-1 border-t-2 border-fill" style={{ width: `${pct}%` }} />
          <span
            className="absolute top-0 -ml-[5px] size-2.5 rounded-full bg-pin shadow-[0_0_0_4px_var(--pin-soft)]"
            style={{ left: `${pct}%` }}
          />
        </div>
        <a
          href="#lesson"
          className="flex min-h-12 items-center gap-3 rounded-lg px-2.5 py-1 font-semibold text-muted-foreground no-underline hover:bg-muted"
        >
          <span className="w-[34px] flex-none text-[13px] whitespace-nowrap">1–10</span>
          <span className="flex-1">How the web works</span>
          <span className="text-[13px]">all read</span>
        </a>
        <Eyebrow className="px-2.5 pt-3 pb-1">JavaScript under the hood</Eyebrow>
        {LESSONS.map((l) => {
          const today = l.status === "today"
          return (
            <a
              key={l.n}
              href="#lesson"
              aria-current={today ? "page" : undefined}
              className={cn(
                "flex min-h-12 items-center gap-3 rounded-lg border-2 px-2.5 py-1 no-underline hover:bg-muted",
                today ? "border-pin bg-card" : "border-transparent",
                l.status === "" || l.status === "tonight" ? "text-muted-foreground" : "text-foreground"
              )}
            >
              <span className="w-[26px] flex-none text-sm text-muted-foreground">{l.n}</span>
              <span className={cn("min-w-0 flex-1", today ? "font-bold" : "font-medium")}>{l.title}</span>
              <span className={cn("flex-none text-[13px] font-semibold", today ? "text-pin-ink" : "text-muted-foreground")}>
                {l.status}
              </span>
            </a>
          )
        })}
      </Card>

      <Card as="article" id="lesson" className="min-w-0 flex-[999_1_560px] gap-[18px] p-[18px] md:px-11 md:py-10">
        <Eyebrow>Lesson 14 · JavaScript under the hood · 5 min read</Eyebrow>
        <PageHeading>Closures</PageHeading>
        <p className="m-0 max-w-[62ch] text-[19px] leading-[1.55] text-body">
          A closure is a function that remembers the variables around it, even after the code that created them has
          finished. It is how JavaScript keeps private state.
        </p>

        <div className="flex max-w-[68ch] flex-col gap-1.5 rounded-lg bg-muted px-5 py-4">
          <span className="font-semibold">Builds on</span>
          <span className="text-body">
            Lesson 12: each function call gets its own workspace on the call stack. Lesson 13: a variable lives inside
            the scope where it was declared.
          </span>
        </div>

        <h2 className={h2}>The big idea</h2>
        <p className={prose}>
          Think of a function as a worker leaving the office with a backpack. The backpack holds every variable the
          worker could see at their desk. Wherever the worker goes, the backpack goes too. That backpack is the closure.
        </p>

        <h2 className={h2}>See it in code</h2>
        <pre className="m-0 overflow-x-auto rounded-lg bg-[#101828] px-[22px] py-5 font-mono text-sm leading-[1.6] text-[#F2F4F7]">
          {`function makeCounter() {
  let count = 0;
  return function () {
    count = count + 1;
    return count;
  };
}

const next = makeCounter();
console.log(next()); // 1
console.log(next()); // 2`}
        </pre>
        <p className={prose}>
          makeCounter has finished, yet count is still alive. The inner function carries it in its backpack, and nothing
          else in the program can touch it.
        </p>

        <h2 className={h2}>Interview question</h2>
        <div className="flex max-w-[68ch] flex-col gap-2.5 rounded-lg border border-border px-5 py-4">
          <span className="font-semibold">Why does a loop using var with setTimeout print the same number every time?</span>
          <RevealAnswer>
            Because var creates one variable for the whole loop. Every callback closes over that same variable, and by
            the time they run the loop has ended. Using let gives each turn of the loop its own variable.
          </RevealAnswer>
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-3 border-t border-border pt-3.5">
          <Button size="lg">Mark as read</Button>
          <Link href="/practice" className={buttonVariants({ variant: "outline", size: "lg" })}>
            Drill this topic
          </Link>
          <span className="ml-auto text-sm text-muted-foreground">
            Next: Lesson 15, How this works · arrives this evening at {COURSE.arrives}
          </span>
        </div>
      </Card>
    </PageMain>
  )
}
