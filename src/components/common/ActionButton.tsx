import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ActionButtonProps {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  disabled?: boolean;
  loading?: boolean;
  tooltip?: string;
  className?: string;
}

export function ActionButton({
  icon,
  label,
  onClick,
  variant = "outline",
  size = "sm",
  disabled = false,
  loading = false,
  tooltip,
  className
}: ActionButtonProps) {
  const button = (
    <Button
      variant={variant}
      size={size}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        "flex items-center gap-2 transition-all duration-200",
        "hover:scale-[1.02] active:scale-[0.98]",
        loading && "cursor-wait",
        className
      )}
    >
      <span className={cn(
        "transition-transform duration-200",
        loading && "animate-spin"
      )}>
        {icon}
      </span>
      {size !== "icon" && (
        <span className="font-medium">
          {loading ? "Processando..." : label}
        </span>
      )}
    </Button>
  );

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {button}
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-sm">{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
}