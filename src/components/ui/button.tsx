import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariantsBase = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding font-semibold whitespace-nowrap no-underline transition-colors select-none cursor-pointer active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // Cobalt: the only colour for things you can press.
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        outline:
          "border-input bg-card text-foreground hover:bg-muted aria-expanded:bg-muted",
        // Navy: a committed or running action (e.g. stop a timer).
        fill: "bg-fill text-fill-foreground hover:bg-fill/90",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)]",
        ghost: "text-foreground hover:bg-muted aria-expanded:bg-muted",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20",
        link: "text-link underline underline-offset-2 hover:text-foreground",
      },
      size: {
        // 44px minimum touch target everywhere.
        default: "h-11 gap-2 px-4 text-base",
        sm: "h-10 gap-1.5 px-3 text-sm",
        lg: "h-12 gap-2 px-5 text-base",
        xl: "h-13 gap-2 px-6 text-[17px]",
        icon: "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

type ButtonVariantProps = VariantProps<typeof buttonVariantsBase>

/** Resolved through tailwind-merge so it can style a Link as well as a Button. */
function buttonVariants({ className, ...props }: ButtonVariantProps & { className?: string } = {}) {
  return cn(buttonVariantsBase(props), className)
}

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & ButtonVariantProps) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={
        typeof className === "function"
          ? (state) => buttonVariants({ variant, size, className: className(state) })
          : buttonVariants({ variant, size, className })
      }
      {...props}
    />
  )
}

export { Button, buttonVariants }
