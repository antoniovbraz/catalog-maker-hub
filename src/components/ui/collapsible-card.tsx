import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "@/components/ui/icons";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface CollapsibleCardProps {
  title: string;
  icon?: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  className?: string;
}

export const CollapsibleCard: React.FC<CollapsibleCardProps> = ({
  title,
  icon,
  isOpen,
  onToggle,
  children,
  className
}) => {
  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <Card className={cn("border-border/20", className)}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer py-3 transition-colors hover:bg-muted/30">
            <CardTitle className="flex items-center justify-between text-base font-medium">
              <div className="flex items-center gap-2 text-muted-foreground">
                {icon}
                <span>{title}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="size-6 p-0 text-muted-foreground hover:text-foreground"
              >
                {isOpen ? (
                  <ChevronUp className="size-3" />
                ) : (
                  <ChevronDown className="size-3" />
                )}
              </Button>
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent className="animate-accordion-down data-[state=closed]:animate-accordion-up">
          <CardContent className="px-6 pb-4 pt-0">
            {children}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};