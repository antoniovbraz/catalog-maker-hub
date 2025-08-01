import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { pricingService } from "@/services/pricing";
import { PricingFormData, PricingCalculationParams } from "@/types/pricing";
import { toast } from "@/hooks/use-toast";

export const PRICING_QUERY_KEY = "saved_pricing";

export function useSavedPricing() {
  return useQuery({
    queryKey: [PRICING_QUERY_KEY],
    queryFn: () => pricingService.getAllWithDetails(),
    staleTime: 5 * 60 * 1000,
  });
}

export function usePricingByProductAndMarketplace(productId: string, marketplaceId: string) {
  return useQuery({
    queryKey: [PRICING_QUERY_KEY, productId, marketplaceId],
    queryFn: () => pricingService.getByProductAndMarketplace(productId, marketplaceId),
    enabled: !!productId && !!marketplaceId,
  });
}

export function useCalculatePrice() {
  return useMutation({
    mutationFn: (params: PricingCalculationParams) => 
      pricingService.calcularPreco(
        params.productId,
        params.marketplaceId,
        params.taxaCartao,
        params.provisaoDesconto,
        params.margemDesejada
      ),
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: `Erro ao calcular preço: ${error.message}`,
        variant: "destructive",
      });
    },
  });
}

export function useCalculateMargemReal() {
  return useMutation({
    mutationFn: (params: { productId: string; marketplaceId: string; taxaCartao: number; provisaoDesconto: number; precoPraticado: number }) => 
      pricingService.calcularMargemReal(
        params.productId,
        params.marketplaceId,
        params.taxaCartao,
        params.provisaoDesconto,
        params.precoPraticado
      ),
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: `Erro ao calcular margem real: ${error.message}`,
        variant: "destructive",
      });
    },
  });
}

export function useSavePricing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PricingFormData & { preco_sugerido: number; margem_unitaria: number; margem_percentual: number }) => 
      pricingService.upsert({
        product_id: data.product_id,
        marketplace_id: data.marketplace_id,
        custo_total: data.custo_total,
        valor_fixo: data.valor_fixo,
        frete: data.frete,
        comissao: data.comissao,
        taxa_cartao: data.taxa_cartao,
        provisao_desconto: data.provisao_desconto,
        margem_desejada: data.margem_desejada,
        preco_sugerido: data.preco_sugerido,
        preco_praticado: data.preco_praticado,
        margem_unitaria: data.margem_unitaria,
        margem_percentual: data.margem_percentual
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PRICING_QUERY_KEY] });
      toast({
        title: "Sucesso",
        description: "Precificação salva com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteSavedPricing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => pricingService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PRICING_QUERY_KEY] });
      toast({
        title: "Sucesso",
        description: "Precificação deletada com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}