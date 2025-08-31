import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { ML_QUERY_KEYS } from "./useMLIntegration";
import { MLService } from "@/services/ml-service";

interface ResyncProductParams {
  productId: string;
}

interface ResyncBatchParams {
  productIds: string[];
}

export function useMLProductResync() {
  const queryClient = useQueryClient();

  const resyncProduct = useMutation({
    mutationFn: async (params: ResyncProductParams) => {
      console.log('Re-syncing product:', params.productId);
      
      return await MLService.resyncProduct(params.productId);
    },
    onSuccess: (data, variables) => {
      // Invalidar caches relevantes
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ML_QUERY_KEYS.products });
      queryClient.invalidateQueries({ queryKey: ['product', variables.productId] });
      
      toast({
        title: "Re-sincronização Concluída",
        description: "Produto re-sincronizado com sucesso.",
      });
    },
    onError: (error: Error) => {
      console.error('Resync Failed:', error);
      
      toast({
        title: "Erro na Re-sincronização",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resyncBatch = useMutation({
    mutationFn: async (params: ResyncBatchParams) => {
      console.log('Re-syncing batch:', params.productIds.length, 'products');
      
      return await MLService.resyncBatch(params.productIds);
    },
    onSuccess: (data) => {
      // Invalidar caches relevantes
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ML_QUERY_KEYS.products });
      
      toast({
        title: "Re-sincronização em Lote Concluída",
        description: `${data.successful} produtos re-sincronizados com sucesso${data.failed > 0 ? `, ${data.failed} falharam` : ''}.`,
      });
    },
    onError: (error: Error) => {
      console.error('Batch Resync Failed:', error);
      
      toast({
        title: "Erro na Re-sincronização em Lote",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    resyncProduct,
    resyncBatch,
  };
}