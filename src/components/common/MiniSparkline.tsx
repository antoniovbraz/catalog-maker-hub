import React from "react";
import { LineChart, Line, ResponsiveContainer } from "recharts";

interface MiniSparklineProps {
  data: number[];
  color?: string;
  className?: string;
}

export const MiniSparkline: React.FC<MiniSparklineProps> = ({ 
  data, 
  color = "hsl(var(--primary))", 
  className = "h-8 w-16" 
}) => {
  const chartData = data.map((value, index) => ({ value, index }));

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke={color} 
            strokeWidth={1.5}
            dot={false}
            animationDuration={800}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};