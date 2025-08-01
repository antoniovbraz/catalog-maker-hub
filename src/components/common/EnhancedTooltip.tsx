import React from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatarMoeda, formatarPercentual } from "@/utils/pricing";

interface EnhancedTooltipProps {
  children: React.ReactNode;
  title: string;
  details: Array<{
    label: string;
    value: string | number;
    format?: "currency" | "percentage" | "text";
  }>;
}

export const EnhancedTooltip: React.FC<EnhancedTooltipProps> = ({ 
  children, 
  title, 
  details 
}) => {
  const formatValue = (value: string | number, format?: string) => {
    if (typeof value === "string") return value;
    
    switch (format) {
      case "currency":
        return formatarMoeda(value);
      case "percentage":
        return formatarPercentual(value);
      default:
        return value.toString();
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {children}
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-64">
        <div className="space-y-2">
          <p className="font-medium text-sm">{title}</p>
          <div className="space-y-1">
            {details.map((detail, index) => (
              <div key={index} className="flex justify-between text-xs">
                <span className="text-muted-foreground">{detail.label}:</span>
                <span className="font-medium">{formatValue(detail.value, detail.format)}</span>
              </div>
            ))}
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
};