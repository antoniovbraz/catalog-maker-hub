import { PackageOpen } from "lucide-react";
import { Heading, Text } from "@/components/ui/typography";
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
    <div
      className={cn(
        "flex flex-col items-center justify-center py-2xl px-md text-center",
        className
      )}
    >
      <div className="rounded-full bg-muted p-md mb-md">
        {icon || <PackageOpen className="h-8 w-8 text-muted-foreground" />}
      </div>

      <Heading variant="h3" className="text-foreground mb-sm">
        {message}
      </Heading>

      {description && (
        <Text
          variant="caption"
          className="text-muted-foreground mb-lg max-w-sm"
        >
          {description}
        </Text>
      )}
      
      {action}
    </div>
  );
}
