import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { colors, spacing, typography } from "@/styles/design-system"

const buttonVariants = cva(
  cn(
    "inline-flex items-center justify-center whitespace-nowrap rounded-md ring-offset-background transition-all hover:shadow-md active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
    typography.body,
    spacing.gap.sm
  ),
  {
    variants: {
      variant: {
        default: cn(
          colors.primary,
          "hover:bg-primary/90 focus:bg-primary/80 active:bg-primary/95"
        ),
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 focus:bg-destructive/80 active:bg-destructive/95",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground focus:bg-accent/80 active:bg-accent/70",
        secondary: cn(
          colors.secondary,
          "hover:bg-secondary/80 focus:bg-secondary/70 active:bg-secondary/60"
        ),
        ghost:
          "hover:bg-accent hover:text-accent-foreground focus:bg-accent/80 active:bg-accent/70",
        link: cn(
          colors.primaryText,
          "underline-offset-4 hover:underline focus:underline active:text-primary/90"
        ),
      },
      size: {
        default: cn("h-10", spacing.px.md, spacing.py.sm),
        sm: cn("h-9 rounded-md", spacing.px.sm),
        lg: cn("h-11 rounded-md", spacing.px.lg),
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={buttonVariants({ variant, size, className })}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
