import React, { useMemo } from "react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { ChartTooltipProps } from '@/types/charts';
import { colors } from "@/styles/tokens";

interface ProductStrategy {
  product_id: string;
  product_name: string;
  marketplace_name: string;
  giro_percentage: number;
  margin_percentage: number;
  quadrant: "alta_margem_alto_giro" | "alta_margem_baixo_giro" | "baixa_margem_alto_giro" | "baixa_margem_baixo_giro";
  total_revenue: number;
}

interface QuadrantScatterChartProps {
  data: ProductStrategy[];
  margeLimitAlta: number;
  giroLimitAlto: number;
}

const getQuadrantColor = (quadrant: ProductStrategy["quadrant"]) => {
  switch (quadrant) {
    case "alta_margem_alto_giro":
      return colors.success.DEFAULT;
    case "alta_margem_baixo_giro":
      return colors.primary.DEFAULT;
    case "baixa_margem_alto_giro":
      return colors.warning.DEFAULT;
    case "baixa_margem_baixo_giro":
      return colors.destructive.DEFAULT;
    default:
      return colors.muted.foreground;
  }
};

const QuadrantScatterChartComponent: React.FC<QuadrantScatterChartProps> = ({
  data,
  margeLimitAlta,
  giroLimitAlto,
}) => {
  const scatterData = useMemo(
    () =>
      data.map((item, index) => ({
        x: item.giro_percentage,
        y: item.margin_percentage,
        z: Math.log(item.total_revenue + 1) * 5, // Size based on revenue
        name: item.product_name,
        marketplace: item.marketplace_name,
        quadrant: item.quadrant,
        revenue: item.total_revenue,
        index,
      })),
    [data]
  );

  const maxMargin = useMemo(
    () => Math.max(...data.map(d => d.margin_percentage)),
    [data]
  );

  const CustomTooltip = ({ active, payload }: ChartTooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const name = String(data.name || '');
      const marketplace = String(data.marketplace || '');
      const y = Number(data.y || 0);
      const x = Number(data.x || 0);
      const revenue = Number(data.revenue || 0);
      
        return (
          <div className="rounded-lg border bg-background p-3 text-sm shadow-elegant animate-in fade-in">
          <p className="font-semibold text-primary">{name}</p>
          <p className="mb-2 text-xs text-muted-foreground">{marketplace}</p>
          <div className="space-y-xs">
            <div className="flex justify-between">
              <span>Margem:</span>
              <span className="font-medium">{y.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span>Giro:</span>
              <span className="font-medium">{x.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span>Receita:</span>
              <span className="font-medium">R$ {revenue.toFixed(2)}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart
          margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          
          {/* Reference lines */}
          <XAxis 
            type="number" 
            dataKey="x" 
            name="Giro %" 
            domain={[0, 'dataMax + 2']}
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            type="number" 
            dataKey="y" 
            name="Margem %" 
            domain={[0, 'dataMax + 5']}
            tick={{ fontSize: 12 }}
          />
          
          {/* Quadrant dividers */}
          <line
            x1={`${giroLimitAlto}%`}
            y1="0%"
            x2={`${giroLimitAlto}%`}
            y2="100%"
            stroke={colors.muted.foreground}
            strokeDasharray="5,5"
            opacity={0.5}
          />
          <line
            x1="0%"
            y1={`${100 - (margeLimitAlta / maxMargin * 100)}%`}
            x2="100%"
            y2={`${100 - (margeLimitAlta / maxMargin * 100)}%`}
            stroke={colors.muted.foreground}
            strokeDasharray="5,5"
            opacity={0.5}
          />
          
          <Tooltip content={<CustomTooltip />} />
          
          <Scatter data={scatterData}>
            {scatterData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={getQuadrantColor(entry.quadrant)}
                fillOpacity={0.8}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
};

export const QuadrantScatterChart = React.memo(QuadrantScatterChartComponent);