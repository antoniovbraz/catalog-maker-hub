import { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle, XCircle, Clock, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

type StatusType = "active" | "inactive" | "configured" | "pending" | "error" | "warning";

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}

const statusConfig: Record<StatusType, {
  icon: ReactNode;
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
  className: string;
}> = {
  active: {
    icon: <CheckCircle className="size-3" />,
    label: "Ativo",
    variant: "default",
    className: "bg-success text-success-foreground border-success/20"
  },
  inactive: {
    icon: <XCircle className="size-3" />,
    label: "Inativo",
    variant: "secondary",
    className: "bg-muted text-muted-foreground"
  },
  configured: {
    icon: <Settings className="size-3" />,
    label: "Configurado",
    variant: "default",
    className: "bg-primary text-primary-foreground"
  },
  pending: {
    icon: <Clock className="size-3" />,
    label: "Pendente",
    variant: "outline",
    className: "bg-warning/10 text-warning border-warning/20"
  },
  error: {
    icon: <AlertCircle className="size-3" />,
    label: "Erro",
    variant: "destructive",
    className: "bg-destructive text-destructive-foreground"
  },
  warning: {
    icon: <AlertCircle className="size-3" />,
    label: "Atenção",
    variant: "outline",
    className: "bg-warning text-warning-foreground border-warning/20"
  }
};

export function StatusBadge({ 
  status, 
  label, 
  size = "md", 
  showIcon = true 
}: StatusBadgeProps) {
  const config = statusConfig[status];
  const displayLabel = label || config.label;

  const sizeClasses = {
    sm: "text-xs px-2 py-1 gap-1",
    md: "text-sm px-2.5 py-1.5 gap-1.5",
    lg: "text-base px-3 py-2 gap-2"
  };

  return (
    <Badge 
      className={cn(
        "inline-flex items-center font-medium transition-colors",
        config.className,
        sizeClasses[size]
      )}
    >
      {showIcon && config.icon}
      {displayLabel}
    </Badge>
  );
}