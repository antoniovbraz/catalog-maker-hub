import { useQuery } from "@tanstack/react-query";
import { MLService, MLSyncProduct } from "@/services/ml-service";
import { ML_QUERY_KEYS } from "./useMLIntegration";
import { useAuth } from '@/contexts/AuthContext';

export function useMLProducts() {
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id;
  return useQuery<MLSyncProduct[]>({
    queryKey: ML_QUERY_KEYS.products(tenantId),
    queryFn: MLService.getMLProducts,
    enabled: !!tenantId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2,
  });
}