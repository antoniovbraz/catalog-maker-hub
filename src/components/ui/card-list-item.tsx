import * as React from "react"

import { BaseCard, BaseCardProps } from "@/components/ui/base-card"
import { Button } from "@/components/ui/button"
import { Edit, Trash2 } from "@/components/ui/icons"
import { toast } from "@/components/ui/use-toast"
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
    const [liveMessage, setLiveMessage] = React.useState("")

    const handleEdit = () => {
      setLiveMessage("Edit action initiated")
      toast({ title: "Editing item" })
      onEdit?.()
    }

    const handleDelete = () => {
      setLiveMessage("Delete action initiated")
      toast({ title: "Deleting item" })
      onDelete?.()
    }

    const actions = (
      <div className="flex items-center gap-2">
        {onEdit && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleEdit}
            aria-label="Edit item"
            className="size-8"
          >
            <Edit className="size-4" />
          </Button>
        )}
        {onDelete && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            aria-label="Delete item"
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
        className={cn(
          "h-full hover:shadow-md transition-all active:scale-95 hover:bg-muted/50",
          className
        )}
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
        <span aria-live="polite" className="sr-only">
          {liveMessage}
        </span>
        {children}
      </BaseCard>
    )
  }
)

CardListItem.displayName = "CardListItem"

export { CardListItem }

