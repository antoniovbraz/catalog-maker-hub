import { PricingComparison } from "@/hooks/useBulkPricing";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatarMoeda, formatarPercentual } from "@/utils/pricing";

interface PricingComparisonChartProps {
  comparisons: PricingComparison[];
  selectedProducts?: string[];
}

export function PricingComparisonChart({ comparisons, selectedProducts }: PricingComparisonChartProps) {
  // Filtrar produtos selecionados se houver
  const filteredComparisons = selectedProducts?.length 
    ? comparisons.filter(comp => selectedProducts.includes(comp.productId))
    : comparisons.slice(0, 10); // Mostrar apenas os primeiros 10 para legibilidade

  // Transformar dados para o gráfico
  const chartData = filteredComparisons.map(comparison => {
    const item: any = {
      produto: comparison.productName.length > 15 
        ? comparison.productName.substring(0, 15) + '...'
        : comparison.productName,
      produtoCompleto: comparison.productName,
    };

    // Adicionar dados de cada marketplace
    comparison.marketplaces.forEach(marketplace => {
      item[`preco_${marketplace.name}`] = marketplace.precoSugerido;
      item[`margem_${marketplace.name}`] = marketplace.margemPercentual;
    });

    return item;
  });

  // Cores dinâmicas para os marketplaces
  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#ff00ff'];
  const marketplaceNames = Array.from(
    new Set(filteredComparisons.flatMap(comp => comp.marketplaces.map(mp => mp.name)))
  );

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-card-foreground mb-2">{data.produtoCompleto}</p>
          {payload.map((entry: any, index: number) => {
            const isPrice = entry.dataKey.startsWith('preco_');
            const marketplace = entry.dataKey.replace(isPrice ? 'preco_' : 'margem_', '');
            const value = isPrice ? formatarMoeda(entry.value) : formatarPercentual(entry.value);
            const label = isPrice ? 'Preço Sugerido' : 'Margem';
            
            return (
              <p key={index} style={{ color: entry.color }} className="text-sm">
                {marketplace} - {label}: {value}
              </p>
            );
          })}
        </div>
      );
    }
    return null;
  };

  if (!filteredComparisons.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Comparação de Preços por Marketplace</CardTitle>
          <CardDescription>Nenhum dado disponível para comparação</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparação de Preços por Marketplace</CardTitle>
        <CardDescription>
          Preços sugeridos para {filteredComparisons.length} produto(s) em diferentes marketplaces
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="produto" 
              angle={-45}
              textAnchor="end"
              height={80}
              fontSize={12}
              className="text-muted-foreground"
            />
            <YAxis 
              tickFormatter={formatarMoeda}
              fontSize={12}
              className="text-muted-foreground"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            {marketplaceNames.map((marketplace, index) => (
              <Bar
                key={marketplace}
                dataKey={`preco_${marketplace}`}
                name={marketplace}
                fill={colors[index % colors.length]}
                radius={[2, 2, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}