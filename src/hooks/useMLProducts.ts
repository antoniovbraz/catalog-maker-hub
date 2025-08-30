import { useQuery } from "@tanstack/react-query";
import { MLService, MLSyncProduct } from "@/services/ml-service";
import { ML_QUERY_KEYS } from "./useMLIntegration";

export function useMLProducts() {
  return useQuery<MLSyncProduct[]>({
    queryKey: ML_QUERY_KEYS.products,
    queryFn: MLService.getMLProducts,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2,
  });
}