import { PricingComparison } from "@/hooks/useBulkPricing";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatarMoeda, formatarPercentual } from "@/utils/pricing";

interface MarginAnalysisChartProps {
  comparisons: PricingComparison[];
}

export function MarginAnalysisChart({ comparisons }: MarginAnalysisChartProps) {
  // Transformar dados para análise de dispersão (preço vs margem)
  const scatterData = comparisons.flatMap(comparison =>
    comparison.marketplaces.map(marketplace => ({
      produto: comparison.productName,
      marketplace: marketplace.name,
      preco: marketplace.precoSugerido,
      margem: marketplace.margemPercentual,
      margemUnitaria: marketplace.margemUnitaria,
      // Cor baseada na performance da margem
      performance: marketplace.margemPercentual >= 25 ? 'excellent' : 
                  marketplace.margemPercentual >= 15 ? 'good' : 
                  marketplace.margemPercentual >= 10 ? 'average' : 'poor'
    }))
  );

  const getPerformanceColor = (performance: string) => {
    switch (performance) {
      case 'excellent': return '#10b981'; // green-500
      case 'good': return '#3b82f6';      // blue-500
      case 'average': return '#f59e0b';   // amber-500
      case 'poor': return '#ef4444';      // red-500
      default: return '#6b7280';          // gray-500
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-card-foreground mb-1">{data.produto}</p>
          <p className="text-sm text-muted-foreground mb-2">{data.marketplace}</p>
          <p className="text-sm">Preço: {formatarMoeda(data.preco)}</p>
          <p className="text-sm">Margem: {formatarPercentual(data.margem)}</p>
          <p className="text-sm">Margem Unitária: {formatarMoeda(data.margemUnitaria)}</p>
          <div className="flex items-center gap-2 mt-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: getPerformanceColor(data.performance) }}
            />
            <span className="text-xs capitalize">{data.performance}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  if (!scatterData.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Análise de Margem vs Preço</CardTitle>
          <CardDescription>Nenhum dado disponível para análise</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Análise de Margem vs Preço</CardTitle>
        <CardDescription>
          Relação entre preço sugerido e margem percentual por produto/marketplace
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>Excelente (≥25%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span>Bom (15-24%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span>Médio (10-14%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span>Baixo (&lt;10%)</span>
          </div>
        </div>
        
        <ResponsiveContainer width="100%" height={400}>
          <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 40 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              type="number" 
              dataKey="preco" 
              name="Preço"
              tickFormatter={formatarMoeda}
              fontSize={12}
              className="text-muted-foreground"
            />
            <YAxis 
              type="number" 
              dataKey="margem" 
              name="Margem %"
              tickFormatter={(value) => `${value.toFixed(1)}%`}
              fontSize={12}
              className="text-muted-foreground"
            />
            <Tooltip content={<CustomTooltip />} />
            
            <Scatter data={scatterData} fill="#8884d8">
              {scatterData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getPerformanceColor(entry.performance)} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}