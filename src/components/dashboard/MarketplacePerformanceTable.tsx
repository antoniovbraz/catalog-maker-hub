import { PricingComparison } from "@/hooks/useBulkPricing";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatarMoeda, formatarPercentual } from "@/utils/pricing";
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface MarketplacePerformanceTableProps {
  comparisons: PricingComparison[];
}

interface MarketplaceStats {
  id: string;
  name: string;
  avgMargin: number;
  avgPrice: number;
  productCount: number;
  bestProducts: number; // Quantos produtos têm este marketplace como melhor opção
  totalRevenue: number; // Soma dos preços sugeridos
}

export function MarketplacePerformanceTable({ comparisons }: MarketplacePerformanceTableProps) {
  // Calcular estatísticas por marketplace
  const marketplaceStats: Record<string, MarketplaceStats> = {};

  comparisons.forEach(comparison => {
    comparison.marketplaces.forEach(marketplace => {
      if (!marketplaceStats[marketplace.id]) {
        marketplaceStats[marketplace.id] = {
          id: marketplace.id,
          name: marketplace.name,
          avgMargin: 0,
          avgPrice: 0,
          productCount: 0,
          bestProducts: 0,
          totalRevenue: 0,
        };
      }

      const stats = marketplaceStats[marketplace.id];
      stats.productCount++;
      stats.totalRevenue += marketplace.precoSugerido;
      
      // Verifica se é o melhor marketplace para este produto
      if (comparison.melhorMarketplace.id === marketplace.id) {
        stats.bestProducts++;
      }
    });
  });

  // Calcular médias
  Object.values(marketplaceStats).forEach(stats => {
    const margins: number[] = [];
    const prices: number[] = [];

    comparisons.forEach(comparison => {
      const marketplace = comparison.marketplaces.find(mp => mp.id === stats.id);
      if (marketplace) {
        margins.push(marketplace.margemPercentual);
        prices.push(marketplace.precoSugerido);
      }
    });

    stats.avgMargin = margins.reduce((sum, margin) => sum + margin, 0) / margins.length;
    stats.avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
  });

  const sortedStats = Object.values(marketplaceStats).sort(
    (a, b) => b.avgMargin - a.avgMargin
  );

  const getPerformanceBadge = (avgMargin: number) => {
    if (avgMargin >= 25) {
      return <Badge className="bg-green-500 text-white">Excelente</Badge>;
    } else if (avgMargin >= 15) {
      return <Badge className="bg-blue-500 text-white">Bom</Badge>;
    } else if (avgMargin >= 10) {
      return <Badge variant="secondary">Médio</Badge>;
    } else {
      return <Badge variant="destructive">Baixo</Badge>;
    }
  };

  const getTrendIcon = (bestProducts: number, productCount: number) => {
    const ratio = bestProducts / productCount;
    if (ratio >= 0.6) {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    } else if (ratio >= 0.3) {
      return <ArrowUpRight className="h-4 w-4 text-blue-500" />;
    } else {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    }
  };

  if (!sortedStats.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance por Marketplace</CardTitle>
          <CardDescription>Nenhum dado disponível</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance por Marketplace</CardTitle>
        <CardDescription>
          Análise comparativa de {sortedStats.length} marketplace(s) em {comparisons.length} produto(s)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Marketplace</TableHead>
              <TableHead>Performance</TableHead>
              <TableHead className="text-right">Margem Média</TableHead>
              <TableHead className="text-right">Preço Médio</TableHead>
              <TableHead className="text-right">Produtos</TableHead>
              <TableHead className="text-right">Melhor Opção</TableHead>
              <TableHead className="text-right">Receita Total</TableHead>
              <TableHead className="text-center">Tendência</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedStats.map((stats, index) => (
              <TableRow key={stats.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                      {index + 1}
                    </div>
                    <span className="font-medium">{stats.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {getPerformanceBadge(stats.avgMargin)}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatarPercentual(stats.avgMargin)}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatarMoeda(stats.avgPrice)}
                </TableCell>
                <TableCell className="text-right">
                  {stats.productCount}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <span className="font-semibold">{stats.bestProducts}</span>
                    <span className="text-muted-foreground text-sm">
                      ({Math.round((stats.bestProducts / stats.productCount) * 100)}%)
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatarMoeda(stats.totalRevenue)}
                </TableCell>
                <TableCell className="text-center">
                  {getTrendIcon(stats.bestProducts, stats.productCount)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}