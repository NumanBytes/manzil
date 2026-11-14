import { cn } from "@/lib/utils"

/** Small uppercase label above headings and cards. */
export function Eyebrow({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "text-xs font-semibold tracking-[0.08em] uppercase text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

/** Surface card: 20px radius, 1px line. */
export function Card({
  className,
  as = "section",
  ...props
}: React.ComponentProps<"section"> & { as?: "section" | "div" | "aside" | "article" | "form" }) {
  const Tag = as as "section"
  return (
    <Tag
      className={cn(
        "flex flex-col rounded-card border border-border bg-card text-card-foreground",
        className
      )}
      {...props}
    />
  )
}

export function PageHeading({
  className,
  ...props
}: React.ComponentProps<"h1">) {
  return (
    <h1
      className={cn(
        "m-0 font-heading text-[26px] leading-[1.15] font-bold md:text-[32px]",
        className
      )}
      {...props}
    />
  )
}

export function CardTitle({
  className,
  ...props
}: React.ComponentProps<"h2">) {
  return (
    <h2
      className={cn("m-0 font-heading text-lg font-bold", className)}
      {...props}
    />
  )
}

/** The main column every signed-in page uses. */
export function PageMain({
  className,
  ...props
}: React.ComponentProps<"main">) {
  return (
    <main
      className={cn(
        "mx-auto box-border flex w-full max-w-[1200px] flex-1 flex-col gap-[18px] px-4 pt-4 pb-6 md:gap-7 md:px-6 md:pt-7 md:pb-18",
        className
      )}
      {...props}
    />
  )
}

/** Pill toggle used for multi- or single-select answers. */
export function ChoiceChip({
  selected,
  className,
  ...props
}: React.ComponentProps<"button"> & { selected: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        "min-h-11 cursor-pointer rounded-full border-2 px-4 font-semibold",
        selected
          ? "border-fill bg-fill text-fill-foreground"
          : "border-input bg-card text-foreground hover:bg-muted",
        className
      )}
      {...props}
    />
  )
}

/** Round (or square) tick used to mark a step done. Wraps a 44px hit area. */
export function DoneToggle({
  done,
  label,
  onToggle,
  shape = "round",
  className,
}: {
  done: boolean
  label: string
  onToggle: () => void
  shape?: "round" | "square"
  className?: string
}) {
  const small = shape === "square"
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={done}
      aria-label={(done ? "Mark not done: " : "Mark done: ") + label}
      className={cn(
        "grid size-11 flex-none cursor-pointer place-items-center border-0 bg-transparent p-0",
        className
      )}
    >
      <span
        className={cn(
          "box-border grid place-items-center border-2",
          small ? "size-5 rounded-md" : "size-6 rounded-full",
          done ? "border-fill bg-fill" : "border-off bg-card"
        )}
      >
        {done && (
          <svg
            aria-hidden="true"
            width={small ? 12 : 14}
            height={small ? 12 : 14}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-fill-foreground"
          >
            <path d="M5 12l5 5 9-10" />
          </svg>
        )}
      </span>
    </button>
  )
}

/** Thin navy bar on a grey track. */
export function Meter({ pct, label }: { pct: number; label?: string }) {
  return (
    <div
      className="h-2 rounded-full bg-border"
      role={label ? "img" : undefined}
      aria-label={label}
    >
      <div className="h-2 rounded-full bg-fill" style={{ width: `${pct}%` }} />
    </div>
  )
}
