import * as React from "react";
import { cn } from "@/lib/utils";

interface CardGridProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function CardGrid({ children, className, ...props }: CardGridProps) {
  return (
    <div
      className={cn(
        "grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        className
      )}
      {...props}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && (child.props as any)?.highlight) {
          const { highlight, ...rest } = child.props as any;
          return (
            <div className="col-span-full">
              {React.cloneElement(child, rest)}
            </div>
          );
        }
        return child;
      })}
    </div>
  );
}

