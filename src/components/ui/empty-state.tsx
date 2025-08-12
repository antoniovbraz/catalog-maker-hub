import { PackageOpen } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Heading, Text } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateAction {
  label: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: EmptyStateAction;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Card className="flex flex-col items-center justify-center px-md py-2xl text-center">
      <div className="mb-md rounded-full bg-muted p-md">
        {icon || <PackageOpen className="size-8 text-muted-foreground" />}
      </div>

      <Heading variant="h3" className="mb-sm text-foreground">
        {title}
      </Heading>

      {description && (
        <Text variant="caption" className="mb-lg max-w-sm text-muted-foreground">
          {description}
        </Text>
      )}

      {action && (
        <Button onClick={action.onClick} className={cn("mt-md", action.className)}>
          {action.icon}
          {action.label}
        </Button>
      )}
    </Card>
  );
}
