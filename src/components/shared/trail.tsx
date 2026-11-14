import { cn } from "@/lib/utils"
import { FlagIcon } from "./logo"

export type TrailState = "done" | "here" | "ahead"
export type TrailNode = { label: string; state: TrailState }

type Props = {
  nodes: TrailNode[]
  /** 0–1: where the plan says you should be today. Drawn as a hollow tick. */
  plan?: number
  /** Draw on the dark hero surface. */
  onHero?: boolean
  /** Show waypoint labels. Without them the trail is compact (used for mock progress). */
  labels?: boolean
  /** Draw the last waypoint as the destination flag. */
  flag?: boolean
  className?: string
}

/**
 * The Trail. Solid = walked, dashed = ahead, tick = where the plan says you should be,
 * orange pin = you, flag = the destination. Under 520px of width the labels hide and a
 * caption carries the words.
 */
export function Trail({ nodes, plan, onHero = false, labels = true, flag = true, className }: Props) {
  const n = nodes.length
  const last = n - 1
  let hereIdx = nodes.findIndex((x) => x.state === "here")
  if (hereIdx < 0) hereIdx = nodes.map((x) => x.state).lastIndexOf("done")
  const walked = hereIdx < 0 ? 0 : (hereIdx / Math.max(1, last)) * 100
  const hasPlan = typeof plan === "number" && plan >= 0 && plan <= 1

  const c = onHero
    ? {
        walked: "bg-white border-white",
        walkedLine: "border-white",
        aheadLine: "border-[#667085]",
        empty: "bg-hero border-[#98A2B3]",
        halo: "shadow-[0_0_0_6px_#5C2E12]",
        hereInk: "text-[#FFC9A3]",
        ink: "text-white",
        soft: "text-hero-soft",
        muted: "text-hero-muted",
        flag: "text-white bg-hero border-white",
        tick: "bg-white",
      }
    : {
        walked: "bg-fill border-fill",
        walkedLine: "border-fill",
        aheadLine: "border-ahead",
        empty: "bg-card border-off",
        halo: "shadow-[0_0_0_6px_var(--pin-soft)]",
        hereInk: "text-pin-ink",
        ink: "text-foreground",
        soft: "text-muted-foreground",
        muted: "text-muted-foreground",
        flag: "text-fill bg-card border-fill",
        tick: "bg-fill",
      }

  const here = hereIdx >= 0 ? nodes[hereIdx] : undefined
  const next = hereIdx >= 0 && hereIdx < last ? nodes[hereIdx + 1] : undefined
  const aria =
    `Trail with ${n} waypoints; you are at ${here ? here.label || "waypoint " + (hereIdx + 1) : "the start"}` +
    (hasPlan ? `; the plan marker is at ${Math.round(plan! * 100)} percent` : "")

  return (
    <div className={cn("@container", className)}>
      <div
        role="img"
        aria-label={aria}
        className={cn("relative", labels ? "mx-2.5 h-[68px]" : "mx-[18px] h-11")}
      >
        <div className={cn("absolute inset-x-0 top-[29px] border-t-2 border-dashed", c.aheadLine)} />
        <div
          className={cn("absolute left-0 top-[29px] border-t-2 border-solid", c.walkedLine)}
          style={{ width: `${walked.toFixed(2)}%` }}
        />
        {hasPlan && (
          <div className="absolute top-3 h-0 w-0" style={{ left: `${(plan! * 100).toFixed(2)}%` }}>
            <span className={cn("absolute -left-px top-0 h-3 w-0.5", c.tick)} />
            <span className={cn("absolute left-1.5 -top-1.5 text-[11px] font-semibold whitespace-nowrap", c.muted)}>
              plan
            </span>
          </div>
        )}
        {nodes.map((node, i) => {
          const pct = last ? (i / last) * 100 : 0
          const isHere = node.state === "here"
          const isDone = node.state === "done"
          const isFlag = flag && i === last && !isHere
          return (
            <div key={i} className="absolute top-0 h-0 w-0" style={{ left: `${pct.toFixed(2)}%` }}>
              {isHere && labels && (
                <span
                  className={cn(
                    "absolute left-0 top-0 -translate-x-1/2 text-[11px] font-bold tracking-[0.06em] uppercase whitespace-nowrap",
                    c.hereInk
                  )}
                >
                  You are here
                </span>
              )}
              <span
                className={cn(
                  "absolute left-0 box-border grid -translate-x-1/2 place-items-center rounded-full border-2",
                  isHere
                    ? cn("top-[22px] size-4 border-pin bg-pin", c.halo)
                    : isFlag
                      ? cn("top-[13px] size-[34px]", c.flag)
                      : cn("top-6 size-3", isDone ? c.walked : c.empty)
                )}
              >
                {isFlag && <FlagIcon size={18} />}
              </span>
              {labels && node.label && (
                <span
                  className={cn(
                    "absolute left-0 top-[46px] text-xs whitespace-nowrap",
                    isHere ? "font-bold" : "font-medium @max-[520px]:hidden",
                    isHere || isDone ? c.ink : c.soft,
                    i === 0
                      ? "-translate-x-2.5 text-left"
                      : i === last
                        ? "-translate-x-[calc(100%-10px)] text-right"
                        : "-translate-x-1/2 text-center"
                  )}
                >
                  {node.label}
                </span>
              )}
            </div>
          )
        })}
      </div>
      {labels && here && (
        <p className={cn("mt-1.5 mb-0 hidden text-[13px] leading-snug @max-[520px]:block", c.muted)}>
          <span className={cn("font-bold", c.ink)}>
            Milestone {hereIdx + 1} of {n} · {here.label}
          </span>
          {next ? ` · next: ${next.label}` : ""}
        </p>
      )}
    </div>
  )
}
