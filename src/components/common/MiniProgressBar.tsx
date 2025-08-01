import React from "react";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown } from "lucide-react";

interface MiniProgressBarProps {
  value: number;
  target?: number;
  label?: string;
  className?: string;
}

export const MiniProgressBar: React.FC<MiniProgressBarProps> = ({ 
  value, 
  target = 100, 
  label,
  className = "" 
}) => {
  const percentage = Math.min((value / target) * 100, 100);
  const isAboveTarget = value > target;
  const trend = isAboveTarget ? "up" : "down";
  
  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex items-center justify-between text-xs">
        {label && <span className="text-muted-foreground">{label}</span>}
        <div className="flex items-center gap-1">
          <span className="font-medium">{value.toFixed(1)}%</span>
          {trend === "up" ? (
            <TrendingUp className="h-3 w-3 text-success" />
          ) : (
            <TrendingDown className="h-3 w-3 text-destructive" />
          )}
        </div>
      </div>
      <Progress 
        value={percentage} 
        className="h-1.5"
      />
    </div>
  );
};