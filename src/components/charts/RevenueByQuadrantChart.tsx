import React, { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { formatarMoeda } from "@/utils/pricing";
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

interface RevenueByQuadrantChartProps {
  data: ProductStrategy[];
}

const QUADRANT_CONFIG = {
  alta_margem_alto_giro: { name: "⭐ Estrelas", color: colors.success.DEFAULT },
  alta_margem_baixo_giro: { name: "💎 Joias", color: colors.primary.DEFAULT },
  baixa_margem_alto_giro: { name: "🔄 Movimento", color: colors.warning.DEFAULT },
  baixa_margem_baixo_giro: { name: "❓ Questionáveis", color: colors.destructive.DEFAULT },
};

const RevenueByQuadrantChartComponent: React.FC<RevenueByQuadrantChartProps> = ({ data }) => {
  // Aggregate revenue by quadrant
  const chartData = useMemo(
    () =>
      Object.entries(QUADRANT_CONFIG)
        .map(([quadrant, config]) => {
          const quadrantProducts = data.filter(p => p.quadrant === quadrant);
          const totalRevenue = quadrantProducts.reduce((sum, p) => sum + p.total_revenue, 0);
          const productCount = quadrantProducts.length;
          const avgRevenue = productCount > 0 ? totalRevenue / productCount : 0;

          return {
            name: config.name,
            quadrant,
            totalRevenue,
            avgRevenue,
            productCount,
            color: config.color,
          };
        })
        .filter(item => item.productCount > 0),
    [data]
  );

  const CustomTooltip = ({ active, payload, label }: ChartTooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const totalRevenue = Number(data.totalRevenue || 0);
      const avgRevenue = Number(data.avgRevenue || 0);
      const productCount = Number(data.productCount || 0);
      
      return (
        <div className="rounded-lg border bg-background p-3 text-sm shadow-lg">
          <p className="font-medium">{String(label || '')}</p>
          <p>Receita Total: {formatarMoeda(totalRevenue)}</p>
          <p>Receita Média: {formatarMoeda(avgRevenue)}</p>
          <p>Produtos: {productCount}</p>
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        Nenhum dado para exibir
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 11 }}
            interval={0}
          />
          <YAxis 
            tick={{ fontSize: 11 }}
            tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar 
            dataKey="totalRevenue" 
            radius={[4, 4, 0, 0]}
          >
            {chartData.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const RevenueByQuadrantChart = React.memo(RevenueByQuadrantChartComponent);