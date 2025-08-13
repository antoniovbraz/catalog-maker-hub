import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { TrendingUp, BarChart3, Target, Package, PieChart, ScatterChart, AlertTriangle, Star } from '@/components/ui/icons';
import { EnhancedTooltip } from "@/components/common/EnhancedTooltip";
import { QuadrantScatterChart } from "@/components/charts/QuadrantScatterChart";
import { QuadrantDonutChart } from "@/components/charts/QuadrantDonutChart";
import { RevenueByQuadrantChart } from "@/components/charts/RevenueByQuadrantChart";

interface SalesData {
  product_id: string;
  product_name: string;
  marketplace_id: string;
  marketplace_name: string;
  total_quantity: number;
  total_revenue: number;
  avg_margin_percentage: number;
}

interface ProductStrategy {
  product_id: string;
  product_name: string;
  marketplace_id: string;
  marketplace_name: string;
  giro_percentage: number;
  margin_percentage: number;
  quadrant: "alta_margem_alto_giro" | "alta_margem_baixo_giro" | "baixa_margem_alto_giro" | "baixa_margem_baixo_giro";
  total_quantity: number;
  total_revenue: number;
}

interface QuadrantCounts {
  alta_margem_alto_giro: number;
  alta_margem_baixo_giro: number;
  baixa_margem_alto_giro: number;
  baixa_margem_baixo_giro: number;
}

interface StrategyFormProps {
  onCancel?: () => void;
}

export const StrategyForm = ({ onCancel }: StrategyFormProps) => {
  const [margeLimitAlta, setMargeLimitAlta] = useState<number>(10);
  const [giroLimitAlto, setGiroLimitAlto] = useState<number>(5);
  const [isCalculated, setIsCalculated] = useState<boolean>(false);

  // Fetch sales data with product and marketplace info
  const { data: salesData = [], isLoading, refetch } = useQuery({
    queryKey: ["sales-strategy-data"],
    queryFn: async () => {
      // First get sales data
      const { data: sales, error: salesError } = await supabase
        .from("sales")
        .select(`
          product_id,
          marketplace_id,
          quantity,
          price_charged,
          products!inner(name),
          marketplaces!inner(name)
        `);

      if (salesError) throw salesError;

      // Group by product-marketplace combination and calculate metrics
      const groupedData: Record<string, SalesData> = {};

      for (const sale of sales) {
        const key = `${sale.product_id}-${sale.marketplace_id}`;
        
          if (!groupedData[key]) {
            const productField = (sale as { products?: { name: string } | { name: string }[] }).products;
            const marketplaceField = (sale as { marketplaces?: { name: string } | { name: string }[] }).marketplaces;
            const productName = Array.isArray(productField) ? productField?.[0]?.name ?? '' : productField?.name ?? '';
            const marketplaceName = Array.isArray(marketplaceField) ? marketplaceField?.[0]?.name ?? '' : marketplaceField?.name ?? '';

            groupedData[key] = {
              product_id: sale.product_id,
              product_name: productName,
              marketplace_id: sale.marketplace_id,
              marketplace_name: marketplaceName,
              total_quantity: 0,
              total_revenue: 0,
              avg_margin_percentage: 0,
            };
          }

        groupedData[key].total_quantity += sale.quantity;
        groupedData[key].total_revenue += sale.price_charged * sale.quantity;
      }

      // Calculate margins for each product-marketplace combination
      const dataWithMargins = await Promise.all(
        Object.values(groupedData).map(async (item) => {
          try {
            const { data: marginData, error } = await supabase.rpc("calcular_preco", {
              p_product_id: item.product_id,
              p_marketplace_id: item.marketplace_id,
              p_taxa_cartao: 2.5,
              p_provisao_desconto: 10,
              p_margem_desejada: 25,
            });

              if (
                error ||
                !marginData ||
                typeof marginData !== 'object' ||
                'error' in (marginData as Record<string, unknown>)
              ) {
                return { ...item, avg_margin_percentage: 0 };
              }

              const result = marginData as Record<string, number>;
              return {
                ...item,
                avg_margin_percentage: result.margem_percentual || 0,
              };
          } catch (error) {
            return { ...item, avg_margin_percentage: 0 };
          }
        })
      );

      return dataWithMargins;
    },
    enabled: false, // Only run when explicitly triggered
  });

  // Calculate strategy analysis
  const strategyAnalysis = useMemo(() => {
    if (!salesData.length || !isCalculated) return { products: [], quadrantCounts: {} as QuadrantCounts };

    // Calculate total quantity sold across all products
    const totalQuantityOverall = salesData.reduce((sum, item) => sum + item.total_quantity, 0);

    // Calculate giro percentage and classify products
    const products: ProductStrategy[] = salesData.map((item) => {
      const giro_percentage = totalQuantityOverall > 0 ? (item.total_quantity / totalQuantityOverall) * 100 : 0;
      
      const isAltaMargem = item.avg_margin_percentage >= margeLimitAlta;
      const isAltoGiro = giro_percentage >= giroLimitAlto;

      let quadrant: ProductStrategy["quadrant"];
      if (isAltaMargem && isAltoGiro) {
        quadrant = "alta_margem_alto_giro";
      } else if (isAltaMargem && !isAltoGiro) {
        quadrant = "alta_margem_baixo_giro";
      } else if (!isAltaMargem && isAltoGiro) {
        quadrant = "baixa_margem_alto_giro";
      } else {
        quadrant = "baixa_margem_baixo_giro";
      }

      return {
        product_id: item.product_id,
        product_name: item.product_name,
        marketplace_id: item.marketplace_id,
        marketplace_name: item.marketplace_name,
        giro_percentage,
        margin_percentage: item.avg_margin_percentage,
        quadrant,
        total_quantity: item.total_quantity,
        total_revenue: item.total_revenue,
      };
    });

    // Count products in each quadrant
    const quadrantCounts: QuadrantCounts = {
      alta_margem_alto_giro: products.filter(p => p.quadrant === "alta_margem_alto_giro").length,
      alta_margem_baixo_giro: products.filter(p => p.quadrant === "alta_margem_baixo_giro").length,
      baixa_margem_alto_giro: products.filter(p => p.quadrant === "baixa_margem_alto_giro").length,
      baixa_margem_baixo_giro: products.filter(p => p.quadrant === "baixa_margem_baixo_giro").length,
    };

    return { products, quadrantCounts };
  }, [salesData, margeLimitAlta, giroLimitAlto, isCalculated]);

  const handleCalculate = () => {
    setIsCalculated(true);
    refetch();
  };

  const getQuadrantColor = (quadrant: ProductStrategy["quadrant"]) => {
    switch (quadrant) {
      case "alta_margem_alto_giro": return "bg-green-100 border-green-300 text-green-800";
      case "alta_margem_baixo_giro": return "bg-blue-100 border-blue-300 text-blue-800";
      case "baixa_margem_alto_giro": return "bg-yellow-100 border-yellow-300 text-yellow-800";
      case "baixa_margem_baixo_giro": return "bg-red-100 border-red-300 text-red-800";
      default: return "bg-gray-100 border-gray-300 text-gray-800";
    }
  };

  const getQuadrantTitle = (quadrant: ProductStrategy["quadrant"]) => {
    switch (quadrant) {
      case "alta_margem_alto_giro": return "⭐ Estrelas";
      case "alta_margem_baixo_giro": return "💎 Joias";
      case "baixa_margem_alto_giro": return "🔄 Movimento";
      case "baixa_margem_baixo_giro": return "❓ Questionáveis";
      default: return "Indefinido";
    }
  };

  const getQuadrantStrategy = (quadrant: ProductStrategy["quadrant"]) => {
    switch (quadrant) {
      case "alta_margem_alto_giro": return "Mantenha preços e invista em marketing";
      case "alta_margem_baixo_giro": return "Aumente promoções para acelerar vendas";
      case "baixa_margem_alto_giro": return "Melhore margem ou use para atrair clientes";
      case "baixa_margem_baixo_giro": return "Considere descontinuar ou reposicionar";
      default: return "";
    }
  };

  return (
    <div className="space-y-lg">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="size-5" />
            Parâmetros da Estratégia
          </CardTitle>
          <CardDescription>
            Configure os limites para classificação de produtos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="margem_limit">Limite Margem Alta (%)</Label>
              <Input
                id="margem_limit"
                type="number"
                step="0.1"
                value={margeLimitAlta}
                onChange={(e) => setMargeLimitAlta(parseFloat(e.target.value) || 0)}
                placeholder="Ex: 10"
              />
            </div>

            <div>
              <Label htmlFor="giro_limit">Limite Giro Alto (%)</Label>
              <Input
                id="giro_limit"
                type="number"
                step="0.1"
                value={giroLimitAlto}
                onChange={(e) => setGiroLimitAlto(parseFloat(e.target.value) || 0)}
                placeholder="Ex: 5"
              />
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleCalculate} 
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? "Calculando..." : "Analisar Estratégia"}
              </Button>
              {onCancel && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onCancel}
                  className="min-w-[100px]"
                >
                  Cancelar
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {isCalculated && (
        <>
          {/* Quadrant Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="size-5" />
                Resumo por Quadrante
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
                <EnhancedTooltip
                  title="Produtos Estrela"
                  details={[
                    { label: "Estratégia", value: "Manter preços e investir em marketing", format: "text" },
                    { label: "Performance", value: "Excelente", format: "text" }
                  ]}
                >
                  <div className="cursor-help rounded-lg border border-green-200 bg-green-50 p-3 text-center transition-colors hover:bg-green-100">
                    <div className="mb-1 flex items-center justify-center gap-2">
                      <Star className="size-4 text-green-600" />
                      <div className="text-2xl font-bold text-green-600">
                        {strategyAnalysis.quadrantCounts.alta_margem_alto_giro}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">⭐ Estrelas</div>
                  </div>
                </EnhancedTooltip>
                
                <EnhancedTooltip
                  title="Produtos Joia"
                  details={[
                    { label: "Estratégia", value: "Aumentar promoções para acelerar vendas", format: "text" },
                    { label: "Performance", value: "Boa margem, baixo volume", format: "text" }
                  ]}
                >
                  <div className="cursor-help rounded-lg border border-blue-200 bg-blue-50 p-3 text-center transition-colors hover:bg-blue-100">
                    <div className="text-2xl font-bold text-blue-600">
                      {strategyAnalysis.quadrantCounts.alta_margem_baixo_giro}
                    </div>
                    <div className="text-sm text-muted-foreground">💎 Joias</div>
                  </div>
                </EnhancedTooltip>
                
                <EnhancedTooltip
                  title="Produtos Movimento"
                  details={[
                    { label: "Estratégia", value: "Melhorar margem ou usar para atrair clientes", format: "text" },
                    { label: "Performance", value: "Alto volume, baixa margem", format: "text" }
                  ]}
                >
                  <div className="cursor-help rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-center transition-colors hover:bg-yellow-100">
                    <div className="text-2xl font-bold text-yellow-600">
                      {strategyAnalysis.quadrantCounts.baixa_margem_alto_giro}
                    </div>
                    <div className="text-sm text-muted-foreground">🔄 Movimento</div>
                  </div>
                </EnhancedTooltip>
                
                <EnhancedTooltip
                  title="Produtos Questionáveis"
                  details={[
                    { label: "Estratégia", value: "Considerar descontinuar ou reposicionar", format: "text" },
                    { label: "Performance", value: "Crítica", format: "text" }
                  ]}
                >
                  <div className="cursor-help rounded-lg border border-red-200 bg-red-50 p-3 text-center transition-colors hover:bg-red-100">
                    <div className="mb-1 flex items-center justify-center gap-2">
                      <AlertTriangle className="size-4 text-red-600" />
                      <div className="text-2xl font-bold text-red-600">
                        {strategyAnalysis.quadrantCounts.baixa_margem_baixo_giro}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">❓ Questionáveis</div>
                  </div>
                </EnhancedTooltip>
              </div>
              
              {/* Subtle Charts with Enhanced Animations */}
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="transition-all duration-300 hover:scale-[1.02]">
                  <h4 className="mb-3 flex items-center gap-2 text-sm font-medium">
                    <PieChart className="size-4 text-primary" />
                    Distribuição dos Quadrantes
                  </h4>
                  <div className="rounded-lg border bg-gradient-to-br from-card to-card/50 p-md">
                    <QuadrantDonutChart quadrantCounts={strategyAnalysis.quadrantCounts} />
                  </div>
                </div>
                <div className="transition-all duration-300 hover:scale-[1.02]">
                  <h4 className="mb-3 flex items-center gap-2 text-sm font-medium">
                    <BarChart3 className="size-4 text-primary" />
                    Receita por Quadrante
                  </h4>
                  <div className="rounded-lg border bg-gradient-to-br from-card to-card/50 p-md">
                    <RevenueByQuadrantChart data={strategyAnalysis.products} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Strategic Positioning Chart */}
          <Card className="transition-all duration-300 hover:shadow-elegant">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ScatterChart className="size-5 text-primary" />
                Posicionamento Estratégico
              </CardTitle>
              <CardDescription>
                Visualização da posição de cada produto na matriz margem x giro
              </CardDescription>
            </CardHeader>
            <CardContent className="bg-gradient-to-br from-card to-card/50">
              <QuadrantScatterChart 
                data={strategyAnalysis.products}
                margeLimitAlta={margeLimitAlta}
                giroLimitAlto={giroLimitAlto}
              />
            </CardContent>
          </Card>

          {/* Quadrant Matrix */}
          <Card>
            <CardHeader>
              <CardTitle>Matriz Estratégica</CardTitle>
              <CardDescription>
                Produtos classificados por margem e giro de vendas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid h-96 grid-cols-2 gap-4">
                {/* Top Left: Alta Margem + Baixo Giro */}
                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">💎 Joias</CardTitle>
                      <Badge variant="secondary">
                        {strategyAnalysis.quadrantCounts.alta_margem_baixo_giro}
                      </Badge>
                    </div>
                    <CardDescription className="text-xs">
                      Alta Margem + Baixo Giro
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="max-h-32 space-y-xs overflow-y-auto">
                      {strategyAnalysis.products
                        .filter(p => p.quadrant === "alta_margem_baixo_giro")
                        .slice(0, 5)
                        .map((product, i) => (
                        <div key={i} className="rounded border bg-white p-xs text-xs">
                          <div className="truncate font-medium">{product.product_name}</div>
                          <div className="text-muted-foreground">{product.marketplace_name}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Top Right: Alta Margem + Alto Giro */}
                <Card className="border-green-200 bg-green-50">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">⭐ Estrelas</CardTitle>
                      <Badge variant="secondary">
                        {strategyAnalysis.quadrantCounts.alta_margem_alto_giro}
                      </Badge>
                    </div>
                    <CardDescription className="text-xs">
                      Alta Margem + Alto Giro
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="max-h-32 space-y-xs overflow-y-auto">
                      {strategyAnalysis.products
                        .filter(p => p.quadrant === "alta_margem_alto_giro")
                        .slice(0, 5)
                        .map((product, i) => (
                        <div key={i} className="rounded border bg-white p-xs text-xs">
                          <div className="truncate font-medium">{product.product_name}</div>
                          <div className="text-muted-foreground">{product.marketplace_name}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Bottom Left: Baixa Margem + Baixo Giro */}
                <Card className="border-red-200 bg-red-50">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">❓ Questionáveis</CardTitle>
                      <Badge variant="secondary">
                        {strategyAnalysis.quadrantCounts.baixa_margem_baixo_giro}
                      </Badge>
                    </div>
                    <CardDescription className="text-xs">
                      Baixa Margem + Baixo Giro
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="max-h-32 space-y-xs overflow-y-auto">
                      {strategyAnalysis.products
                        .filter(p => p.quadrant === "baixa_margem_baixo_giro")
                        .slice(0, 5)
                        .map((product, i) => (
                        <div key={i} className="rounded border bg-white p-xs text-xs">
                          <div className="truncate font-medium">{product.product_name}</div>
                          <div className="text-muted-foreground">{product.marketplace_name}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Bottom Right: Baixa Margem + Alto Giro */}
                <Card className="border-yellow-200 bg-yellow-50">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">🔄 Movimento</CardTitle>
                      <Badge variant="secondary">
                        {strategyAnalysis.quadrantCounts.baixa_margem_alto_giro}
                      </Badge>
                    </div>
                    <CardDescription className="text-xs">
                      Baixa Margem + Alto Giro
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="max-h-32 space-y-xs overflow-y-auto">
                      {strategyAnalysis.products
                        .filter(p => p.quadrant === "baixa_margem_alto_giro")
                        .slice(0, 5)
                        .map((product, i) => (
                        <div key={i} className="rounded border bg-white p-xs text-xs">
                          <div className="truncate font-medium">{product.product_name}</div>
                          <div className="text-muted-foreground">{product.marketplace_name}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Axis Labels */}
              <div className="relative mt-4">
                <div className="absolute -left-6 top-1/2 -translate-y-1/2 -rotate-90 text-xs text-muted-foreground">
                  Margem →
                </div>
                <div className="mt-2 text-center text-xs text-muted-foreground">
                  ← Giro →
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="size-5" />
                Lista Detalhada de Produtos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-md">
                {(["alta_margem_alto_giro", "alta_margem_baixo_giro", "baixa_margem_alto_giro", "baixa_margem_baixo_giro"] as const).map((quadrant) => {
                  const products = strategyAnalysis.products.filter(p => p.quadrant === quadrant);
                  if (products.length === 0) return null;

                  return (
                    <div key={quadrant}>
                      <div className="mb-2 flex items-center gap-2">
                        <h4 className="font-semibold">{getQuadrantTitle(quadrant)}</h4>
                        <Badge variant="outline">{products.length} produtos</Badge>
                      </div>
                      <p className="mb-3 text-sm text-muted-foreground">
                        {getQuadrantStrategy(quadrant)}
                      </p>
                      <div className="grid gap-2">
                        {products.map((product, i) => (
                          <div key={i} className={`rounded-lg border p-3 ${getQuadrantColor(quadrant)}`}>
                            <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-5">
                              <div>
                                <div className="font-medium">{product.product_name}</div>
                                <div className="text-xs opacity-70">{product.marketplace_name}</div>
                              </div>
                              <div>
                                <div className="flex items-center gap-1">
                                  <TrendingUp className="size-3" />
                                  <span>Margem: {product.margin_percentage.toFixed(1)}%</span>
                                </div>
                              </div>
                              <div>
                                <div className="flex items-center gap-1">
                                  <BarChart3 className="size-3" />
                                  <span>Giro: {product.giro_percentage.toFixed(1)}%</span>
                                </div>
                              </div>
                              <div>
                                <span>Qtd: {product.total_quantity}</span>
                              </div>
                              <div>
                                <span>Receita: R$ {product.total_revenue.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      {quadrant !== "baixa_margem_baixo_giro" && <Separator className="mt-4" />}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {!isCalculated && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              Configure os parâmetros e clique em "Analisar Estratégia" para ver a classificação dos produtos
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};