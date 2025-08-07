import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCalculatePrice, useSavePricing } from "./usePricing";
import { useAutomaticPricingUpdate } from "./useAutomaticPricingUpdate";
import { PRICING_CONFIG } from "@/lib/config";
import { useToast } from "@/components/ui/use-toast";
import { useLogger } from "@/utils/logger";
import { arrayMove } from "@dnd-kit/sortable";
import type { DragEndEvent } from "@dnd-kit/core";
import type { PricingResult, SortOption } from "@/components/forms/dashboard/types";

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

export function useDashboardForm() {
  const { toast } = useToast();
  const logger = useLogger("DashboardForm");
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedMarketplaces, setSelectedMarketplaces] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("margem_percentual");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [cardOrder, setCardOrder] = useState<string[]>([]);
  const [isRecalculating, setIsRecalculating] = useState(false);

  const calculatePrice = useCalculatePrice();
  const savePricing = useSavePricing();
  useAutomaticPricingUpdate();

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

  const recalculateAndSave = useCallback(async (productId: string, marketplaceIds: string[]) => {
    if (!productId || marketplaceIds.length === 0) return;

    setIsRecalculating(true);

    try {
      const defaultParams = {
        taxaCartao: PRICING_CONFIG.DEFAULT_TAXA_CARTAO,
        provisaoDesconto: PRICING_CONFIG.DEFAULT_PROVISAO_DESCONTO,
        margemDesejada: 25,
      };

      const promises = marketplaceIds.map(async (marketplaceId) => {
        try {
          const calculationResult = await calculatePrice.mutateAsync({
            productId,
            marketplaceId,
            taxaCartao: defaultParams.taxaCartao,
            provisaoDesconto: defaultParams.provisaoDesconto,
            margemDesejada: defaultParams.margemDesejada,
          });

          if (calculationResult && typeof calculationResult === "object") {
            const result = calculationResult as Record<string, number>;

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
              preco_praticado: result.preco_sugerido,
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
      logger.error("Erro durante recálculo automático", error);
    } finally {
      setIsRecalculating(false);
    }
  }, [calculatePrice, savePricing, toast, logger]);

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

  const [realMargins, setRealMargins] = useState<Record<string, { margem_unitaria_real: number; margem_percentual_real: number }>>({});

  useEffect(() => {
    const calculateRealMargins = async () => {
      if (savedPricings.length === 0) return;

      const newRealMargins: Record<string, { margem_unitaria_real: number; margem_percentual_real: number }> = {};

      for (const pricing of savedPricings) {
        try {
          const { data, error } = await supabase.rpc("calcular_margem_real", {
            p_product_id: pricing.product_id,
            p_marketplace_id: pricing.marketplace_id,
            p_taxa_cartao: pricing.taxa_cartao,
            p_provisao_desconto: pricing.provisao_desconto,
            p_preco_praticado: pricing.preco_praticado,
          });

          if (!error && data && typeof data === "object") {
            const result = data as Record<string, number>;
            newRealMargins[pricing.marketplace_id] = {
              margem_unitaria_real: result.margem_unitaria_real,
              margem_percentual_real: result.margem_percentual_real,
            };
          }
        } catch (error) {
          logger.error("Erro ao calcular margem real", error);
        }
      }

      setRealMargins(newRealMargins);
    };

    calculateRealMargins();
  }, [savedPricings, logger]);

  const transformedResults: PricingResult[] = savedPricings
    .map(pricing => {
      const realMargin = realMargins[pricing.marketplace_id];
      return {
        marketplace_id: pricing.marketplace_id,
        marketplace_name: 'Marketplace',
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
        product_name: '',
        product_sku: '',
      } as PricingResult;
    })
    .sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      const multiplier = sortOrder === "asc" ? 1 : -1;
      return (aValue - bValue) * multiplier;
    });

  const results: PricingResult[] = cardOrder.length > 0 && cardOrder.length === transformedResults.length
    ? cardOrder.map(id => transformedResults.find(r => r.marketplace_id === id)).filter(Boolean) as PricingResult[]
    : transformedResults;

  useEffect(() => {
    if (transformedResults.length > 0 && cardOrder.length === 0) {
      setCardOrder(transformedResults.map(r => r.marketplace_id));
    }
  }, [transformedResults, cardOrder.length]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = cardOrder.indexOf(active.id as string);
      const newIndex = cardOrder.indexOf(over.id as string);
      setCardOrder((items) => arrayMove(items, oldIndex, newIndex));
    }
  };

  const isLoading = loadingSavedPricings || isRecalculating;

  return {
    products,
    marketplaces,
    loadingProducts,
    loadingMarketplaces,
    selectedProductId,
    setSelectedProductId,
    selectedMarketplaces,
    handleMarketplaceToggle,
    sortBy,
    sortOrder,
    handleSort,
    cardOrder,
    results,
    handleDragEnd,
    isLoading,
    recalculateAndSave,
    isRecalculating,
  };
}
