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
    <Card className="flex flex-col items-center justify-center py-2xl px-md text-center">
      <div className="rounded-full bg-muted p-md mb-md">
        {icon || <PackageOpen className="h-8 w-8 text-muted-foreground" />}
      </div>

      <Heading variant="h3" className="text-brand-dark mb-sm">
        {title}
      </Heading>

      {description && (
        <Text variant="caption" className="text-muted-foreground mb-lg max-w-sm">
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
