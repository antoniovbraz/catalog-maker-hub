import { useQuery } from "@tanstack/react-query";
import { useProducts } from "./useProducts";
import { useMarketplaces } from "./useMarketplaces";
import { pricingService } from "@/services/pricing";
import { QUERY_CONFIG } from "@/lib/config";

export interface BulkPricingResult {
  productId: string;
  productName: string;
  marketplaceId: string;
  marketplaceName: string;
  precoSugerido: number;
  margemPercentual: number;
  margemUnitaria: number;
  custoTotal: number;
  hasError: boolean;
  errorMessage?: string;
}

export interface PricingComparison {
  productId: string;
  productName: string;
  marketplaces: {
    id: string;
    name: string;
    precoSugerido: number;
    margemPercentual: number;
    margemUnitaria: number;
  }[];
  melhorMarketplace: {
    id: string;
    name: string;
    precoSugerido: number;
    margemPercentual: number;
  };
}

export function useBulkPricingCalculations() {
  const { data: products = [] } = useProducts();
  const { data: marketplaces = [] } = useMarketplaces();

  return useQuery({
    queryKey: ['bulk-pricing-calculations', products.length, marketplaces.length],
    queryFn: async (): Promise<BulkPricingResult[]> => {
      const results: BulkPricingResult[] = [];
      
      for (const product of products) {
        for (const marketplace of marketplaces) {
          try {
            // Usando valores padrão para demonstração
            const calculation = await pricingService.calcularPreco(
              product.id,
              marketplace.id,
              3.5, // taxa cartão padrão
              2.0, // provisão desconto padrão
              20.0 // margem desejada padrão
            );

            results.push({
              productId: product.id,
              productName: product.name,
              marketplaceId: marketplace.id,
              marketplaceName: marketplace.name,
              precoSugerido: calculation.preco_sugerido || 0,
              margemPercentual: calculation.margem_percentual || 0,
              margemUnitaria: calculation.margem_unitaria || 0,
              custoTotal: calculation.custo_total || 0,
              hasError: false,
            });
          } catch (error) {
            results.push({
              productId: product.id,
              productName: product.name,
              marketplaceId: marketplace.id,
              marketplaceName: marketplace.name,
              precoSugerido: 0,
              margemPercentual: 0,
              margemUnitaria: 0,
              custoTotal: 0,
              hasError: true,
              errorMessage: error instanceof Error ? error.message : 'Erro desconhecido',
            });
          }
        }
      }
      
      return results;
    },
    enabled: products.length > 0 && marketplaces.length > 0,
    staleTime: QUERY_CONFIG.STALE_TIME,
    refetchOnWindowFocus: false,
  });
}

export function usePricingComparisons() {
  const { data: bulkResults = [] } = useBulkPricingCalculations();

  return useQuery({
    queryKey: ['pricing-comparisons', bulkResults.length],
    queryFn: (): PricingComparison[] => {
      const groupedByProduct = bulkResults.reduce((acc, result) => {
        if (result.hasError) return acc;
        
        if (!acc[result.productId]) {
          acc[result.productId] = {
            productId: result.productId,
            productName: result.productName,
            marketplaces: [],
            melhorMarketplace: {
              id: '',
              name: '',
              precoSugerido: 0,
              margemPercentual: 0,
            },
          };
        }

        const marketplaceData = {
          id: result.marketplaceId,
          name: result.marketplaceName,
          precoSugerido: result.precoSugerido,
          margemPercentual: result.margemPercentual,
          margemUnitaria: result.margemUnitaria,
        };

        acc[result.productId].marketplaces.push(marketplaceData);

        // Determinar melhor marketplace (maior margem percentual)
        if (result.margemPercentual > acc[result.productId].melhorMarketplace.margemPercentual) {
          acc[result.productId].melhorMarketplace = {
            id: result.marketplaceId,
            name: result.marketplaceName,
            precoSugerido: result.precoSugerido,
            margemPercentual: result.margemPercentual,
          };
        }

        return acc;
      }, {} as Record<string, PricingComparison>);

      return Object.values(groupedByProduct);
    },
    enabled: bulkResults.length > 0,
    staleTime: QUERY_CONFIG.STALE_TIME,
  });
}