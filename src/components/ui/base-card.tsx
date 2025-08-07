import * as React from "react"

import { Card, CardHeader, CardContent } from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"

export interface BaseCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  icon?: React.ReactNode
  title?: React.ReactNode
  status?: React.ReactNode
  actions?: React.ReactNode
  contentPadding?: string
  contentSpacing?: string
  collapsible?: boolean
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

const BaseCard = React.forwardRef<HTMLDivElement, BaseCardProps>(
  (
    {
      icon,
      title,
      status,
      actions,
      children,
      contentPadding = "p-md",
      contentSpacing = "space-y-md",
      collapsible = false,
      open,
      defaultOpen,
      onOpenChange,
      className,
      ...props
    },
    ref
  ) => {
    const contentClasses = cn(contentPadding, contentSpacing)

    const header = (
      <CardHeader className="flex flex-row items-center justify-between p-md">
        {collapsible ? (
          <>
            <CollapsibleTrigger asChild>
              <div className="flex flex-1 items-center justify-between text-left">
                <div className="flex items-center gap-2">
                  {icon}
                  {title}
                </div>
                {status}
              </div>
            </CollapsibleTrigger>
            {actions}
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              {icon}
              {title}
            </div>
            <div className="flex items-center gap-2">
              {status}
              {actions}
            </div>
          </>
        )}
      </CardHeader>
    )

    const content = (
      <CardContent className={contentClasses}>{children}</CardContent>
    )

    if (collapsible) {
      return (
        <Collapsible
          open={open}
          defaultOpen={defaultOpen}
          onOpenChange={onOpenChange}
        >
          <Card ref={ref} className={className} {...props}>
            {header}
            <CollapsibleContent>{content}</CollapsibleContent>
          </Card>
        </Collapsible>
      )
    }

    return (
      <Card ref={ref} className={className} {...props}>
        {header}
        {content}
      </Card>
    )
  }
)

BaseCard.displayName = "BaseCard"

export { BaseCard }

