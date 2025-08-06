import * as React from "react"

import { BaseCard, BaseCardProps } from "@/components/ui/base-card"
import { Button } from "@/components/ui/button"
import { Edit, Trash2 } from "@/components/ui/icons"
import { cn } from "@/lib/utils"

export interface CardListItemProps extends Omit<BaseCardProps, "title" | "actions" | "status"> {
  title: React.ReactNode
  subtitle?: React.ReactNode
  status?: React.ReactNode
  onEdit?: () => void
  onDelete?: () => void
}

const CardListItem = React.forwardRef<HTMLDivElement, CardListItemProps>(
  (
    { title, subtitle, status, onEdit, onDelete, children, className, ...props },
    ref
  ) => {
    const actions = (
      <div className="flex items-center gap-2">
        {onEdit && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onEdit}
            className="size-8"
          >
            <Edit className="size-4" />
          </Button>
        )}
        {onDelete && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="size-8"
          >
            <Trash2 className="size-4" />
          </Button>
        )}
      </div>
    )

    return (
      <BaseCard
        ref={ref}
        className={cn("h-full", className)}
        title={
          <div className="flex flex-col">
            <span className="font-medium leading-none">{title}</span>
            {subtitle && (
              <span className="text-sm text-muted-foreground">{subtitle}</span>
            )}
          </div>
        }
        status={status}
        actions={actions}
        {...props}
      >
        {children}
      </BaseCard>
    )
  }
)

CardListItem.displayName = "CardListItem"

export { CardListItem }

