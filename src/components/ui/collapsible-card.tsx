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
  variant?: 'primary' | 'secondary' | 'default';
}

export const CollapsibleCard: React.FC<CollapsibleCardProps> = ({
  title,
  icon,
  isOpen,
  onToggle,
  children,
  className,
  variant = 'default'
}) => {
  const headerVariants = {
    primary: "bg-gradient-primary text-white",
    secondary: "bg-gradient-card text-white", 
    default: "bg-muted/50 text-foreground"
  };

  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <Card className={cn("shadow-form border border-border/50", className)}>
        <CollapsibleTrigger asChild>
          <CardHeader 
            className={cn(
              "cursor-pointer hover:opacity-90 transition-opacity rounded-t-lg",
              headerVariants[variant]
            )}
          >
            <CardTitle className="text-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                {icon}
                {title}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 w-8 p-0",
                  variant === 'default' 
                    ? "text-foreground hover:bg-muted" 
                    : "text-white hover:bg-white/20"
                )}
              >
                {isOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent className="animate-accordion-down data-[state=closed]:animate-accordion-up">
          <CardContent className="p-lg">
            {children}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};