import Link from "next/link"
import { cn } from "@/lib/utils"

/** The flag: the destination. Used as the logo and as the Trail's last waypoint. */
export function FlagIcon({ className, size = 24 }: { className?: string; size?: number }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M5 21V4h11l-2 4 2 4H5" />
    </svg>
  )
}

export function Logo({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex min-h-11 items-center gap-2.5 font-heading text-[21px] font-bold text-foreground no-underline",
        className
      )}
    >
      <FlagIcon />
      Manzil
    </Link>
  )
}
