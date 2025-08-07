import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import {
  Card as PrimitiveCard,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from "./card"
import { cn } from "@/lib/utils"

const cardVariants = cva("", {
  variants: {
    variant: {
      default: "",
      highlight:
        "border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10",
      pricing: "border-2 border-primary/30",
    },
  },
  defaultVariants: {
    variant: "default",
  },
})

export interface CardProps
  extends React.ComponentPropsWithoutRef<typeof PrimitiveCard>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, ...props }, ref) => (
    <PrimitiveCard
      ref={ref}
      className={cn(cardVariants({ variant }), className)}
      {...props}
    />
  )
)
Card.displayName = "Card"

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
}

