import React, { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown, TrendingUp, TrendingDown, DollarSign, Package, Target, GripVertical, RefreshCw } from '@/components/ui/icons';
import { Sparkline } from "@/components/ui/sparkline";
import { MiniProgressBar } from "@/components/common/MiniProgressBar";
import { EnhancedTooltip } from "@/components/common/EnhancedTooltip";
import { useCalculatePrice, useSavePricing } from "@/hooks/usePricing";
import { useAutomaticPricingUpdate } from "@/hooks/useAutomaticPricingUpdate";
import { PRICING_CONFIG } from "@/lib/config";
import { useLogger } from "@/utils/logger";
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
  preco_praticado: number;
  created_at: string;
  updated_at: string;
}

type SortOption = "margem_percentual" | "margem_unitaria" | "preco_sugerido";

// Componente para card drag-and-drop individual
interface SortableCardProps {
  result: {
    marketplace_id: string;
    marketplace_name: string;
    custo_total: number;
    valor_fixo: number;
    frete: number;
    comissao: number;
    preco_sugerido: number;
    margem_unitaria: number;
    margem_percentual: number;
    preco_praticado: number;
    taxa_cartao: number;
    provisao_desconto: number;
    margem_desejada: number;
    product_name: string;
    product_sku: string;
  };
  index: number;
}

const SortableCard = ({ result, index }: SortableCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: result.marketplace_id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
  };

  // Simular dados históricos para sparkline (em um app real, viriam do banco)
  const sparklineData = Array.from({ length: 7 }, () => Math.random() * 10 + result.margem_percentual);

  return (
    <Card 
      ref={setNodeRef} 
      style={style} 
      className={`
        group relative bg-gradient-to-br from-card to-card/50
        transition-all duration-300 ease-in-out
        hover:shadow-elegant hover:border-primary/30
        hover:scale-[1.02] hover:bg-gradient-to-br hover:from-card hover:to-primary/5
        ${isDragging ? 'z-50 rotate-1 scale-105 shadow-elegant' : ''}
      `}
      {...attributes}
    >
      {index === 0 && (
        <Badge className="absolute -top-2 -right-2 bg-success text-success-foreground animate-scale-in">
          🏆 Melhor
        </Badge>
      )}
      <div {...listeners} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-200 touch-none">
        <GripVertical className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors cursor-grab active:cursor-grabbing" />
      </div>
      
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="truncate">{result.marketplace_name}</span>
            <EnhancedTooltip
              title="Performance da Margem"
              details={[
                { label: "Margem Atual", value: result.margem_percentual, format: "percentage" },
                { label: "Meta de Margem", value: result.margem_desejada, format: "percentage" },
                { label: "Preço Sugerido", value: result.preco_sugerido, format: "currency" },
                { label: "Margem Unitária", value: result.margem_unitaria, format: "currency" }
              ]}
            >
              <div className="flex items-center gap-1">
                <Badge variant={result.margem_percentual >= 15 ? "default" : "secondary"}>
                  {result.margem_percentual.toFixed(1)}%
                </Badge>
                {result.margem_percentual >= result.margem_desejada ? (
                  <TrendingUp className="h-3 w-3 text-success" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-warning" />
                )}
              </div>
            </EnhancedTooltip>
          </div>
          <Sparkline
            data={sparklineData}
            stroke={result.margem_percentual >= 15 ? "hsl(var(--success))" : "hsl(var(--warning))"}
            size="sm"
          />
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <MiniProgressBar 
          value={result.margem_percentual} 
          target={result.margem_desejada} 
          label="Meta de Margem"
          className="mb-3"
        />
        
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="space-y-xs">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Package className="h-3 w-3" />
              <span>Custo Total</span>
            </div>
            <div className="font-medium">R$ {result.custo_total.toFixed(2)}</div>
          </div>
          
          <div className="space-y-xs">
            <div className="flex items-center gap-1 text-muted-foreground">
              <DollarSign className="h-3 w-3" />
              <span>Preço Praticado</span>
            </div>
            <div className="font-bold text-lg">R$ {result.preco_praticado.toFixed(2)}</div>
          </div>
          
          <div className="space-y-xs">
            <div className="flex items-center gap-1 text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              <span>Margem R$</span>
            </div>
            <div className="font-semibold text-success">R$ {result.margem_unitaria.toFixed(2)}</div>
          </div>
          
          <div className="space-y-xs">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Target className="h-3 w-3" />
              <span>Comissão</span>
            </div>
            <div className="font-medium">{result.comissao.toFixed(2)}%</div>
          </div>
        </div>
        
        <div className="pt-3 border-t border-border/50">
          <div className="text-xs font-medium text-foreground mb-2">
            Para atingir {result.margem_desejada.toFixed(1)}% de margem:
          </div>
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-primary font-medium">Preço Sugerido:</span>
              <span className="font-bold text-primary">R$ {result.preco_sugerido.toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        <div className="pt-2 border-t border-border/30 text-xs text-muted-foreground space-y-xs">
          <div className="font-medium text-foreground mb-2">Detalhamento:</div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1">
            <div>Valor Fixo: R$ {result.valor_fixo.toFixed(2)}</div>
            <div>Frete: R$ {result.frete.toFixed(2)}</div>
            <div>Taxa Cartão: {result.taxa_cartao.toFixed(1)}%</div>
            <div>Prov. Desc.: {result.provisao_desconto.toFixed(1)}%</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const DashboardForm = () => {
  const { toast } = useToast();
  const logger = useLogger('DashboardForm');
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedMarketplaces, setSelectedMarketplaces] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("margem_percentual");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [cardOrder, setCardOrder] = useState<string[]>([]);
  const [isRecalculating, setIsRecalculating] = useState(false);

  // Hooks para cálculo e salvamento
  const calculatePrice = useCalculatePrice();
  const savePricing = useSavePricing();

  // Hook para atualização automática das precificações
  useAutomaticPricingUpdate();

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
  const { data: savedPricings = [], isLoading: loadingSavedPricings } = useQuery<SavedPricing[]>({
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

  // Função para recalcular e salvar automaticamente
  const recalculateAndSave = useCallback(async (productId: string, marketplaceIds: string[]) => {
    if (!productId || marketplaceIds.length === 0) return;

    setIsRecalculating(true);
    
    try {
      // Valores padrão para cálculo (podem ser configuráveis no futuro)
      const defaultParams = {
        taxaCartao: PRICING_CONFIG.DEFAULT_TAXA_CARTAO,
        provisaoDesconto: PRICING_CONFIG.DEFAULT_PROVISAO_DESCONTO,
        margemDesejada: 25, // Margem padrão de 25%
      };

      // Processar cada marketplace em paralelo
      const promises = marketplaceIds.map(async (marketplaceId) => {
        try {
          // Calcular preço atualizado
          const calculationResult = await calculatePrice.mutateAsync({
            productId,
            marketplaceId,
            taxaCartao: defaultParams.taxaCartao,
            provisaoDesconto: defaultParams.provisaoDesconto,
            margemDesejada: defaultParams.margemDesejada,
          });

          if (calculationResult && typeof calculationResult === 'object') {
            const result = calculationResult as any;
            
            // Salvar automaticamente os dados atualizados
            await savePricing.mutateAsync({
              product_id: productId,
              marketplace_id: marketplaceId,
              custo_total: result.custo_total,
              valor_fixo: result.valor_fixo,
              frete: result.frete,
              comissao: result.comissao,
              taxa_cartao: defaultParams.taxaCartao,
              provisao_desconto: defaultParams.provisaoDesconto,
              margem_desejada: defaultParams.margemDesejada,
              preco_praticado: result.preco_sugerido, // Usar preço sugerido como praticado inicialmente
              preco_sugerido: result.preco_sugerido,
              margem_unitaria: result.margem_unitaria,
              margem_percentual: result.margem_percentual,
            });
          }
        } catch (error) {
          logger.error(`Erro ao recalcular marketplace ${marketplaceId}`, error);
        }
      });

      await Promise.all(promises);
      
      toast({
        title: "Dados atualizados",
        description: `Preços recalculados com as configurações mais atuais para ${marketplaceIds.length} marketplace(s)`,
      });
    } catch (error) {
      logger.error('Erro durante recálculo automático', error);
    } finally {
      setIsRecalculating(false);
    }
  }, [calculatePrice, savePricing, toast]);

  const handleMarketplaceToggle = (marketplaceId: string) => {
    setSelectedMarketplaces(prev => {
      const newMarketplaces = prev.includes(marketplaceId)
        ? prev.filter(id => id !== marketplaceId)
        : prev.length < 6
          ? [...prev, marketplaceId]
          : prev;

      if (newMarketplaces.length >= 6 && !prev.includes(marketplaceId)) {
        toast({
          title: "Limite atingido",
          description: "Você pode selecionar no máximo 6 marketplaces",
          variant: "destructive",
        });
        return prev;
      }

      return newMarketplaces;
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

  // State to store real margins
  const [realMargins, setRealMargins] = useState<{[key: string]: {margem_unitaria_real: number, margem_percentual_real: number}}>({});

  // Calculate real margins when savedPricings change
  useEffect(() => {
    const calculateRealMargins = async () => {
      if (savedPricings.length === 0) return;
      
      const newRealMargins: {[key: string]: {margem_unitaria_real: number, margem_percentual_real: number}} = {};
      
      for (const pricing of savedPricings) {
        try {
          const { data, error } = await supabase.rpc('calcular_margem_real', {
            p_product_id: pricing.product_id,
            p_marketplace_id: pricing.marketplace_id,
            p_taxa_cartao: pricing.taxa_cartao,
            p_provisao_desconto: pricing.provisao_desconto,
            p_preco_praticado: pricing.preco_praticado
          });

          if (!error && data && typeof data === 'object') {
            newRealMargins[pricing.marketplace_id] = {
              margem_unitaria_real: (data as any).margem_unitaria_real,
              margem_percentual_real: (data as any).margem_percentual_real
            };
          }
        } catch (error) {
          logger.error('Erro ao calcular margem real', error);
        }
      }
      
      setRealMargins(newRealMargins);
    };

    calculateRealMargins();
  }, [savedPricings]);

  // Transform and organize saved pricing data for display
  const transformedResults = savedPricings
    .map(pricing => {
      const realMargin = realMargins[pricing.marketplace_id];
      return {
        marketplace_id: pricing.marketplace_id,
        marketplace_name: 'Marketplace', // Will be populated from separate query
        custo_total: pricing.custo_total,
        valor_fixo: pricing.valor_fixo,
        frete: pricing.frete,
        comissao: pricing.comissao,
        preco_sugerido: pricing.preco_sugerido,
        margem_unitaria: realMargin?.margem_unitaria_real || pricing.margem_unitaria,
        margem_percentual: realMargin?.margem_percentual_real || pricing.margem_percentual,
        preco_praticado: pricing.preco_praticado,
        taxa_cartao: pricing.taxa_cartao,
        provisao_desconto: pricing.provisao_desconto,
        margem_desejada: pricing.margem_desejada,
        product_name: '', // Will be populated from separate query
        product_sku: '', // Will be populated from separate query
      };
    })
    .sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      const multiplier = sortOrder === "asc" ? 1 : -1;
      return (aValue - bValue) * multiplier;
    });

  // Organize results based on drag-and-drop order or default sorting
  const results = cardOrder.length > 0 && cardOrder.length === transformedResults.length
    ? cardOrder.map(id => transformedResults.find(r => r.marketplace_id === id)).filter(Boolean) as typeof transformedResults
    : transformedResults;

  // Update card order when transformed results change
  useEffect(() => {
    if (transformedResults.length > 0 && cardOrder.length === 0) {
      setCardOrder(transformedResults.map(r => r.marketplace_id));
    }
  }, [transformedResults, cardOrder.length]);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = cardOrder.indexOf(active.id as string);
      const newIndex = cardOrder.indexOf(over.id as string);
      
      setCardOrder((items) => arrayMove(items, oldIndex, newIndex));
    }
  };

  const isLoading = loadingSavedPricings || isRecalculating;

  return (
    <div className="space-y-lg">
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
              {isRecalculating && <RefreshCw className="h-4 w-4 animate-spin text-primary" />}
            </CardTitle>
            <CardDescription>
              Selecione até 6 marketplaces para comparar - os dados serão atualizados automaticamente
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
      
      {/* Manual recalculation button */}
      {selectedProductId && selectedMarketplaces.length > 0 && (
        <div className="flex justify-end">
          <Button
            onClick={() => recalculateAndSave(selectedProductId, selectedMarketplaces)}
            disabled={isRecalculating}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            {isRecalculating ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Atualizar com dados mais recentes
          </Button>
        </div>
      )}
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
        <div className="space-y-md">
          <h3 className="text-lg font-semibold">Comparação de Preços</h3>
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(selectedMarketplaces.length)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-sm">
                      <div className="h-3 bg-muted rounded"></div>
                      <div className="h-3 bg-muted rounded w-5/6"></div>
                      <div className="h-3 bg-muted rounded w-4/6"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : results.length > 0 ? (
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext 
                items={cardOrder} 
                strategy={verticalListSortingStrategy}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.map((result, index) => (
                    <SortableCard 
                      key={result.marketplace_id} 
                      result={result} 
                      index={index}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
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