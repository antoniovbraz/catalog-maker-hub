import { PackageOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: React.ReactNode;
  message: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  message,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-12 px-4 text-center",
      className
    )}>
      <div className="rounded-full bg-muted p-4 mb-4">
        {icon || <PackageOpen className="h-8 w-8 text-muted-foreground" />}
      </div>
      
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {message}
      </h3>
      
      {description && (
        <p className="text-muted-foreground text-sm mb-6 max-w-sm">
          {description}
        </p>
      )}
      
      {action}
    </div>
  );
}