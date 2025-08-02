import { useState, useMemo } from "react";
import { Target, TrendingUp, BarChart3, Calculator, Eye } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SmartForm } from "@/components/ui/smart-form";
import { DataVisualization } from "@/components/ui/data-visualization";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { QuadrantDonutChart } from "@/components/charts/QuadrantDonutChart";
import { RevenueByQuadrantChart } from "@/components/charts/RevenueByQuadrantChart";
import { QuadrantScatterChart } from "@/components/charts/QuadrantScatterChart";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface SalesData {
  product_id: string;
  product_name: string;
  marketplace_name: string;
  total_quantity: number;
  total_revenue: number;
  avg_margin: number;
}

interface ProductStrategy {
  product_id: string;
  product_name: string;
  marketplace_name: string;
  total_quantity: number;
  total_revenue: number;
  avg_margin: number;
  giro_percentage: number;
  quadrant: "alta_margem_alto_giro" | "alta_margem_baixo_giro" | "baixa_margem_alto_giro" | "baixa_margem_baixo_giro";
}

interface QuadrantCounts {
  alta_margem_alto_giro: number;
  alta_margem_baixo_giro: number;
  baixa_margem_alto_giro: number;
  baixa_margem_baixo_giro: number;
}

export function StrategyFormEnhanced() {
  const [margeLimitAlta, setMargeLimitAlta] = useState<number>(20);
  const [giroLimitAlto, setGiroLimitAlto] = useState<number>(10);
  const [isCalculated, setIsCalculated] = useState(false);

  const { data: salesData, isLoading, refetch } = useQuery({
    queryKey: ['strategy-analysis'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          product_id,
          products!inner(name),
          marketplaces!inner(name),
          quantity,
          price_charged
        `);

      if (error) throw error;

      // Aggregate data by product-marketplace
      const aggregated = data.reduce((acc: any, sale: any) => {
        const key = `${sale.product_id}-${sale.marketplaces.name}`;
        if (!acc[key]) {
          acc[key] = {
            product_id: sale.product_id,
            product_name: sale.products.name,
            marketplace_name: sale.marketplaces.name,
            total_quantity: 0,
            total_revenue: 0,
            total_margin: 0,
            count: 0
          };
        }
        
        acc[key].total_quantity += sale.quantity;
        acc[key].total_revenue += sale.price_charged * sale.quantity;
        acc[key].total_margin += 20; // Estimated margin for calculation
        acc[key].count += 1;
        
        return acc;
      }, {});

      return Object.values(aggregated).map((item: any) => ({
        ...item,
        avg_margin: item.total_margin / item.count
      })) as SalesData[];
    },
    enabled: false
  });

  const strategyAnalysis = useMemo(() => {
    if (!salesData) return { products: [], quadrantCounts: { alta_margem_alto_giro: 0, alta_margem_baixo_giro: 0, baixa_margem_alto_giro: 0, baixa_margem_baixo_giro: 0 } };

    const totalQuantity = salesData.reduce((sum, item) => sum + item.total_quantity, 0);
    
    const products: ProductStrategy[] = salesData.map(item => {
      const giro_percentage = (item.total_quantity / totalQuantity) * 100;
      
      let quadrant: "alta_margem_alto_giro" | "alta_margem_baixo_giro" | "baixa_margem_alto_giro" | "baixa_margem_baixo_giro";
      if (item.avg_margin >= margeLimitAlta && giro_percentage >= giroLimitAlto) {
        quadrant = "alta_margem_alto_giro";
      } else if (item.avg_margin >= margeLimitAlta && giro_percentage < giroLimitAlto) {
        quadrant = "alta_margem_baixo_giro";
      } else if (item.avg_margin < margeLimitAlta && giro_percentage >= giroLimitAlto) {
        quadrant = "baixa_margem_alto_giro";
      } else {
        quadrant = "baixa_margem_baixo_giro";
      }

      return {
        ...item,
        giro_percentage,
        quadrant
      };
    });

    const quadrantCounts: QuadrantCounts = products.reduce((acc, product) => {
      acc[product.quadrant as keyof QuadrantCounts]++;
      return acc;
    }, { alta_margem_alto_giro: 0, alta_margem_baixo_giro: 0, baixa_margem_alto_giro: 0, baixa_margem_baixo_giro: 0 });

    return { products, quadrantCounts };
  }, [salesData, margeLimitAlta, giroLimitAlto]);

  const handleCalculate = () => {
    setIsCalculated(true);
    refetch();
  };

  const getQuadrantColor = (quadrant: string): "active" | "inactive" | "configured" | "pending" | "error" | "warning" => {
    switch (quadrant) {
      case "alta_margem_alto_giro": return "active";
      case "alta_margem_baixo_giro": return "warning";
      case "baixa_margem_alto_giro": return "configured";
      case "baixa_margem_baixo_giro": return "error";
      default: return "inactive";
    }
  };

  const getQuadrantTitle = (quadrant: string) => {
    switch (quadrant) {
      case "alta_margem_alto_giro": return "Estrelas ⭐";
      case "alta_margem_baixo_giro": return "Interrogação ❓";
      case "baixa_margem_alto_giro": return "Vacas Leiteiras 🐄";
      case "baixa_margem_baixo_giro": return "Abacaxis 🍍";
      default: return "Indefinido";
    }
  };

  const getQuadrantStrategy = (quadrant: string) => {
    switch (quadrant) {
      case "alta_margem_alto_giro": return "Manter e investir - produtos ideais";
      case "alta_margem_baixo_giro": return "Aumentar promoção e visibilidade";
      case "baixa_margem_alto_giro": return "Otimizar custos e fornecedores";
      case "baixa_margem_baixo_giro": return "Considerar descontinuar";
      default: return "Analisar individualmente";
    }
  };

  const columns = [
    {
      key: "product_name",
      header: "Produto",
      sortable: true,
    },
    {
      key: "marketplace_name", 
      header: "Marketplace",
      sortable: true,
    },
    {
      key: "quadrant",
      header: "Quadrante",
      sortable: true,
      render: (item: ProductStrategy) => (
        <StatusBadge 
          status={getQuadrantColor(item.quadrant)} 
          label={getQuadrantTitle(item.quadrant)}
        />
      )
    },
    {
      key: "avg_margin",
      header: "Margem (%)",
      sortable: true,
      render: (item: ProductStrategy) => `${item.avg_margin.toFixed(1)}%`
    },
    {
      key: "giro_percentage",
      header: "Giro (%)",
      sortable: true,
      render: (item: ProductStrategy) => `${item.giro_percentage.toFixed(2)}%`
    },
    {
      key: "total_quantity",
      header: "Qtd Vendida",
      sortable: true,
    },
    {
      key: "total_revenue",
      header: "Receita",
      sortable: true,
      render: (item: ProductStrategy) => `R$ ${item.total_revenue.toFixed(2)}`
    }
  ];

  const configurationSections = [
    {
      id: "parametros",
      title: "Parâmetros da Análise",
      description: "Configure os limites para classificação dos produtos na matriz BCG",
      icon: <Calculator className="h-5 w-5" />,
      children: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="margin-limit">Limite Margem Alta (%)</Label>
            <Input
              id="margin-limit"
              type="number"
              value={margeLimitAlta}
              onChange={(e) => setMargeLimitAlta(Number(e.target.value))}
              placeholder="Ex: 20"
            />
            <p className="text-sm text-muted-foreground">
              Produtos com margem acima deste valor são considerados de alta margem
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="giro-limit">Limite Giro Alto (%)</Label>
            <Input
              id="giro-limit"
              type="number"
              step="0.1"
              value={giroLimitAlto}
              onChange={(e) => setGiroLimitAlto(Number(e.target.value))}
              placeholder="Ex: 10"
            />
            <p className="text-sm text-muted-foreground">
              Produtos com giro acima deste valor são considerados de alto giro
            </p>
          </div>

          <div className="md:col-span-2">
            <Button 
              onClick={handleCalculate}
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Calculando..." : "Calcular Estratégia"}
            </Button>
          </div>
        </div>
      )
    }
  ];

  const resultsSections = isCalculated && strategyAnalysis.products.length > 0 ? [
    {
      id: "resumo",
      title: "Resumo Estratégico",
      description: "Visão geral da distribuição dos produtos por quadrante",
      icon: <BarChart3 className="h-5 w-5" />,
      children: (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-success">
                {strategyAnalysis.quadrantCounts.alta_margem_alto_giro}
              </div>
              <div className="text-sm text-muted-foreground">Estrelas ⭐</div>
              <div className="text-xs text-success">Manter e investir</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-warning">
                {strategyAnalysis.quadrantCounts.alta_margem_baixo_giro}
              </div>
              <div className="text-sm text-muted-foreground">Interrogação ❓</div>
              <div className="text-xs text-warning">Aumentar promoção</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-info">
                {strategyAnalysis.quadrantCounts.baixa_margem_alto_giro}
              </div>
              <div className="text-sm text-muted-foreground">Vacas Leiteiras 🐄</div>
              <div className="text-xs text-info">Otimizar custos</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-destructive">
                {strategyAnalysis.quadrantCounts.baixa_margem_baixo_giro}
              </div>
              <div className="text-sm text-muted-foreground">Abacaxis 🍍</div>
              <div className="text-xs text-destructive">Considerar descontinuar</div>
            </CardContent>
          </Card>
        </div>
      )
    },
    {
      id: "graficos",
      title: "Análise Visual",
      description: "Gráficos interativos para análise estratégica",
      icon: <TrendingUp className="h-5 w-5" />,
      children: (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Distribuição por Quadrante</CardTitle>
            </CardHeader>
            <CardContent>
              <QuadrantDonutChart quadrantCounts={strategyAnalysis.quadrantCounts} />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Receita por Quadrante</CardTitle>
            </CardHeader>
            <CardContent>
              <RevenueByQuadrantChart data={strategyAnalysis.products.map(p => ({ ...p, margin_percentage: p.avg_margin }))} />
            </CardContent>
          </Card>
          
          <Card className="lg:col-span-2 xl:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Matriz BCG</CardTitle>
            </CardHeader>
            <CardContent>
              <QuadrantScatterChart 
                data={strategyAnalysis.products.map(p => ({ ...p, margin_percentage: p.avg_margin }))}
                margeLimitAlta={margeLimitAlta}
                giroLimitAlto={giroLimitAlto}
              />
            </CardContent>
          </Card>
        </div>
      )
    },
    {
      id: "detalhamento",
      title: "Detalhamento por Produto",
      description: "Lista completa com recomendações estratégicas",
      icon: <Eye className="h-5 w-5" />,
      children: (
        <DataVisualization
          title="Produtos por Quadrante"
          data={strategyAnalysis.products.map(p => ({ ...p, id: p.product_id }))}
          columns={columns.map(col => ({
            ...col,
            render: col.render ? (item: any) => col.render!(item as ProductStrategy) : undefined
          }))}
          searchable={true}
          emptyState={<div className="text-center py-8"><p className="text-muted-foreground">Nenhum produto analisado ainda</p></div>}
        />
      )
    }
  ] : [];

  return (
    <SmartForm
      title="Análise Estratégica de Produtos"
      sections={[...configurationSections, ...resultsSections]}
    />
  );
}