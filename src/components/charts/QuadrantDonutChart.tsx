import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface QuadrantCounts {
  alta_margem_alto_giro: number;
  alta_margem_baixo_giro: number;
  baixa_margem_alto_giro: number;
  baixa_margem_baixo_giro: number;
}

interface QuadrantDonutChartProps {
  quadrantCounts: QuadrantCounts;
}

const QUADRANT_DATA = [
  { 
    name: "Estrelas", 
    key: "alta_margem_alto_giro", 
    color: "#22c55e",
    emoji: "⭐",
    description: "Alta Margem + Alto Giro"
  },
  { 
    name: "Joias", 
    key: "alta_margem_baixo_giro", 
    color: "#3b82f6",
    emoji: "💎",
    description: "Alta Margem + Baixo Giro"
  },
  { 
    name: "Movimento", 
    key: "baixa_margem_alto_giro", 
    color: "#eab308",
    emoji: "🔄",
    description: "Baixa Margem + Alto Giro"
  },
  { 
    name: "Questionáveis", 
    key: "baixa_margem_baixo_giro", 
    color: "#ef4444",
    emoji: "❓",
    description: "Baixa Margem + Baixo Giro"
  },
];

export const QuadrantDonutChart: React.FC<QuadrantDonutChartProps> = ({ quadrantCounts }) => {
  const data = QUADRANT_DATA.map(quadrant => ({
    name: quadrant.name,
    value: quadrantCounts[quadrant.key as keyof QuadrantCounts],
    color: quadrant.color,
    emoji: quadrant.emoji,
    description: quadrant.description,
  })).filter(item => item.value > 0);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = total > 0 ? ((data.value / total) * 100).toFixed(1) : 0;
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3 text-sm">
          <div className="flex items-center gap-2">
            <span>{data.payload.emoji}</span>
            <span className="font-medium">{data.name}</span>
          </div>
          <p className="text-muted-foreground text-xs">{data.payload.description}</p>
          <p>{data.value} produtos ({percentage}%)</p>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span>{entry.payload.emoji} {entry.value}</span>
            <span className="text-muted-foreground">
              ({entry.payload.value})
            </span>
          </div>
        ))}
      </div>
    );
  };

  if (total === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        Nenhum dado para exibir
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend content={<CustomLegend />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};