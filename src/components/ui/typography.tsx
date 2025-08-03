import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const headingVariants = cva("font-bold", {
  variants: {
    variant: {
      h1: "text-h1",
      h2: "text-h2",
      h3: "text-h3",
      h4: "text-h4",
      h5: "text-h5",
      h6: "text-h6",
    },
  },
  defaultVariants: {
    variant: "h3",
  },
});

export interface HeadingProps
  extends React.HTMLAttributes<HTMLHeadingElement>,
    VariantProps<typeof headingVariants> {}

export const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ className, variant, ...props }, ref) => {
    const Tag = (variant ?? "h3") as keyof JSX.IntrinsicElements;
    return (
      <Tag
        ref={ref}
        className={cn(headingVariants({ variant }), className)}
        {...props}
      />
    );
  }
);
Heading.displayName = "Heading";

const textVariants = cva("", {
  variants: {
    variant: {
      body: "text-body",
      caption: "text-caption",
    },
  },
  defaultVariants: {
    variant: "body",
  },
});

export interface TextProps
  extends React.HTMLAttributes<HTMLParagraphElement>,
    VariantProps<typeof textVariants> {}

export const Text = React.forwardRef<HTMLParagraphElement, TextProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <p ref={ref} className={cn(textVariants({ variant }), className)} {...props} />
    );
  }
);
Text.displayName = "Text";

