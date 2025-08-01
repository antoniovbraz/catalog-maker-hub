import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { formatarMoeda } from "@/utils/pricing";

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
  alta_margem_alto_giro: { name: "⭐ Estrelas", color: "#22c55e" },
  alta_margem_baixo_giro: { name: "💎 Joias", color: "#3b82f6" },
  baixa_margem_alto_giro: { name: "🔄 Movimento", color: "#eab308" },
  baixa_margem_baixo_giro: { name: "❓ Questionáveis", color: "#ef4444" },
};

export const RevenueByQuadrantChart: React.FC<RevenueByQuadrantChartProps> = ({ data }) => {
  // Aggregate revenue by quadrant
  const chartData = Object.entries(QUADRANT_CONFIG).map(([quadrant, config]) => {
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
  }).filter(item => item.productCount > 0);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3 text-sm">
          <p className="font-medium">{label}</p>
          <p>Receita Total: {formatarMoeda(data.totalRevenue)}</p>
          <p>Receita Média: {formatarMoeda(data.avgRevenue)}</p>
          <p>Produtos: {data.productCount}</p>
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
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