import React, { useState } from "react";
import { useQuery, useQueries } from "@tanstack/react-query";
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

interface DashboardResult {
  marketplace_id: string;
  marketplace_name: string;
  custo_total: number;
  valor_fixo: number;
  frete: number;
  comissao: number;
  preco_sugerido: number;
  margem_unitaria: number;
  margem_percentual: number;
  product_name: string;
  product_sku: string;
}

type SortOption = "margem_percentual" | "margem_unitaria" | "preco_sugerido";

export const DashboardForm = () => {
  const { toast } = useToast();
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedMarketplaces, setSelectedMarketplaces] = useState<string[]>([]);
  const [taxaCartao] = useState<number>(2.5); // Default value
  const [provisaoDesconto] = useState<number>(10); // Default value
  const [margemDesejada] = useState<number>(25); // Default value
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

  // Calculate prices for all selected marketplaces
  const priceQueries = useQueries({
    queries: selectedMarketplaces.map((marketplaceId) => ({
      queryKey: ["calculate-price", selectedProductId, marketplaceId, taxaCartao, provisaoDesconto, margemDesejada],
      queryFn: async () => {
        if (!selectedProductId) return null;
        
        const { data, error } = await supabase.rpc("calcular_preco", {
          p_product_id: selectedProductId,
          p_marketplace_id: marketplaceId,
          p_taxa_cartao: taxaCartao,
          p_provisao_desconto: provisaoDesconto,
          p_margem_desejada: margemDesejada,
        });
        
        if (error) throw error;
        
        const result = data as any;
        if ('error' in result) return null;
        
        const marketplace = marketplaces.find(m => m.id === marketplaceId);
        
        return {
          marketplace_id: marketplaceId,
          marketplace_name: marketplace?.name || 'Marketplace',
          ...result
        } as DashboardResult;
      },
      enabled: !!selectedProductId && selectedMarketplaces.length > 0,
    }))
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

  // Get results and sort them
  const results = priceQueries
    .map(query => query.data)
    .filter((result): result is DashboardResult => result !== null)
    .sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      const multiplier = sortOrder === "asc" ? 1 : -1;
      return (aValue - bValue) * multiplier;
    });

  const isLoading = priceQueries.some(query => query.isLoading);

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
                        {product.name} ({product.sku})
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
                    
                    <div className="pt-2 border-t text-xs text-muted-foreground">
                      <div>Valor Fixo: R$ {result.valor_fixo.toFixed(2)}</div>
                      <div>Frete: R$ {result.frete.toFixed(2)}</div>
                      <div>Comissão: {result.comissao.toFixed(2)}%</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">
                  Nenhum resultado encontrado. Verifique se o produto possui dados configurados para os marketplaces selecionados.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {!selectedProductId && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">
              Selecione um produto para começar a comparação
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};