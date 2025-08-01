import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown, TrendingUp, DollarSign, Package, Target } from "lucide-react";

interface Product {
  id: string;
  name: string;
  sku: string;
}

interface Marketplace {
  id: string;
  name: string;
}

interface SavedPricing {
  id: string;
  product_id: string;
  marketplace_id: string;
  taxa_cartao: number;
  provisao_desconto: number;
  margem_desejada: number;
  custo_total: number;
  valor_fixo: number;
  frete: number;
  comissao: number;
  preco_sugerido: number;
  margem_unitaria: number;
  margem_percentual: number;
  created_at: string;
  updated_at: string;
}

type SortOption = "margem_percentual" | "margem_unitaria" | "preco_sugerido";

export const DashboardForm = () => {
  const { toast } = useToast();
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedMarketplaces, setSelectedMarketplaces] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("margem_percentual");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Fetch products
  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, sku")
        .order("name");
      if (error) throw error;
      return data as Product[];
    },
  });

  // Fetch marketplaces
  const { data: marketplaces = [], isLoading: loadingMarketplaces } = useQuery({
    queryKey: ["marketplaces"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketplaces")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data as Marketplace[];
    },
  });

  // Fetch saved pricing for selected product and marketplaces
  const { data: savedPricings = [], isLoading: loadingSavedPricings } = useQuery({
    queryKey: ["saved-pricing", selectedProductId, selectedMarketplaces],
    queryFn: async () => {
      if (!selectedProductId || selectedMarketplaces.length === 0) return [];
      
      const { data, error } = await supabase
        .from("saved_pricing")
        .select(`
          *,
          products!saved_pricing_product_id_fkey(name, sku),
          marketplaces!saved_pricing_marketplace_id_fkey(name)
        `)
        .eq("product_id", selectedProductId)
        .in("marketplace_id", selectedMarketplaces);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedProductId && selectedMarketplaces.length > 0,
  });

  const handleMarketplaceToggle = (marketplaceId: string) => {
    setSelectedMarketplaces(prev => {
      if (prev.includes(marketplaceId)) {
        return prev.filter(id => id !== marketplaceId);
      } else if (prev.length < 6) {
        return [...prev, marketplaceId];
      } else {
        toast({
          title: "Limite atingido",
          description: "Você pode selecionar no máximo 6 marketplaces",
          variant: "destructive",
        });
        return prev;
      }
    });
  };

  const handleSort = (newSortBy: SortOption) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(newSortBy);
      setSortOrder("desc");
    }
  };

  // Transform saved pricing data for display
  const results = savedPricings
    .map(pricing => ({
      marketplace_id: pricing.marketplace_id,
      marketplace_name: pricing.marketplaces?.name || 'Marketplace',
      custo_total: pricing.custo_total,
      valor_fixo: pricing.valor_fixo,
      frete: pricing.frete,
      comissao: pricing.comissao,
      preco_sugerido: pricing.preco_sugerido,
      margem_unitaria: pricing.margem_unitaria,
      margem_percentual: pricing.margem_percentual,
      taxa_cartao: pricing.taxa_cartao,
      provisao_desconto: pricing.provisao_desconto,
      margem_desejada: pricing.margem_desejada,
      product_name: pricing.products?.name || '',
      product_sku: pricing.products?.sku || '',
    }))
    .sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      const multiplier = sortOrder === "asc" ? 1 : -1;
      return (aValue - bValue) * multiplier;
    });

  const isLoading = loadingSavedPricings;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Seleção de Produto
            </CardTitle>
            <CardDescription>
              Selecione um produto para comparar suas precificações salvas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="product">Produto *</Label>
              <Select 
                value={selectedProductId} 
                onValueChange={setSelectedProductId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um produto" />
                </SelectTrigger>
                <SelectContent>
                  {loadingProducts ? (
                    <SelectItem value="loading">Carregando...</SelectItem>
                  ) : (
                    products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}{product.sku ? ` (${product.sku})` : ''}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Marketplaces
              <Badge variant="secondary">{selectedMarketplaces.length}/6</Badge>
            </CardTitle>
            <CardDescription>
              Selecione até 6 marketplaces para comparar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-40 overflow-y-auto">
              {loadingMarketplaces ? (
                <div>Carregando marketplaces...</div>
              ) : (
                marketplaces.map((marketplace) => (
                  <div key={marketplace.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={marketplace.id}
                      checked={selectedMarketplaces.includes(marketplace.id)}
                      onCheckedChange={() => handleMarketplaceToggle(marketplace.id)}
                      disabled={!selectedMarketplaces.includes(marketplace.id) && selectedMarketplaces.length >= 6}
                    />
                    <label
                      htmlFor={marketplace.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {marketplace.name}
                    </label>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sort Controls */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpDown className="h-5 w-5" />
              Ordenação
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={sortBy === "margem_percentual" ? "default" : "outline"}
                size="sm"
                onClick={() => handleSort("margem_percentual")}
                className="flex items-center gap-1"
              >
                Margem %
                {sortBy === "margem_percentual" && (
                  <ArrowUpDown className="h-3 w-3" />
                )}
              </Button>
              <Button
                variant={sortBy === "margem_unitaria" ? "default" : "outline"}
                size="sm"
                onClick={() => handleSort("margem_unitaria")}
                className="flex items-center gap-1"
              >
                Margem R$
                {sortBy === "margem_unitaria" && (
                  <ArrowUpDown className="h-3 w-3" />
                )}
              </Button>
              <Button
                variant={sortBy === "preco_sugerido" ? "default" : "outline"}
                size="sm"
                onClick={() => handleSort("preco_sugerido")}
                className="flex items-center gap-1"
              >
                Preço
                {sortBy === "preco_sugerido" && (
                  <ArrowUpDown className="h-3 w-3" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {selectedProductId && selectedMarketplaces.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Comparação de Preços</h3>
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(selectedMarketplaces.length)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-3 bg-muted rounded"></div>
                      <div className="h-3 bg-muted rounded w-5/6"></div>
                      <div className="h-3 bg-muted rounded w-4/6"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : results.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((result, index) => (
                <Card key={result.marketplace_id} className="relative">
                  {index === 0 && (
                    <Badge className="absolute -top-2 -right-2 bg-green-500">
                      Melhor
                    </Badge>
                  )}
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="truncate">{result.marketplace_name}</span>
                      <Badge variant="outline">#{index + 1}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-1">
                        <Package className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">Custo:</span>
                      </div>
                      <div className="font-medium">R$ {result.custo_total.toFixed(2)}</div>
                      
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">Preço:</span>
                      </div>
                      <div className="font-bold text-lg">R$ {result.preco_sugerido.toFixed(2)}</div>
                      
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3 text-green-600" />
                        <span className="text-muted-foreground">Margem R$:</span>
                      </div>
                      <div className="font-semibold text-green-600">R$ {result.margem_unitaria.toFixed(2)}</div>
                      
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3 text-green-600" />
                        <span className="text-muted-foreground">Margem %:</span>
                      </div>
                      <div className="font-semibold text-green-600">{result.margem_percentual.toFixed(2)}%</div>
                    </div>
                    
                    <div className="pt-2 border-t text-xs text-muted-foreground space-y-1">
                      <div className="font-medium text-foreground">Detalhamento:</div>
                      <div>Valor Fixo: R$ {result.valor_fixo.toFixed(2)}</div>
                      <div>Frete: R$ {result.frete.toFixed(2)}</div>
                      <div>Comissão: {result.comissao.toFixed(2)}%</div>
                      <div>Taxa Cartão: {result.taxa_cartao.toFixed(1)}%</div>
                      <div>Provisão Desc.: {result.provisao_desconto.toFixed(1)}%</div>
                      <div>Margem Alvo: {result.margem_desejada.toFixed(1)}%</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground mb-2">
                  Nenhuma precificação salva encontrada para os marketplaces selecionados.
                </p>
                <p className="text-sm text-muted-foreground">
                  Use a aba "Precificação" para calcular e salvar precificações primeiro.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {!selectedProductId && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground mb-2">
              Selecione um produto e marketplaces para ver as precificações salvas
            </p>
            <p className="text-sm text-muted-foreground">
              Use a aba "Precificação" para calcular e salvar precificações primeiro.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};