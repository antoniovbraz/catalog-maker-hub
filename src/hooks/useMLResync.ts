import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ML_QUERY_KEYS } from "./useMLIntegration";

interface ResyncProductParams {
  productId: string;
}

interface ResyncBatchParams {
  productIds: string[];
}

export function useMLResync() {
  const queryClient = useQueryClient();

  const resyncProduct = useMutation({
    mutationFn: async (params: ResyncProductParams) => {
      console.log('Re-syncing product:', params.productId);
      
      const { data, error } = await supabase.functions.invoke('ml-sync-v2', {
        body: { 
          action: 'resync_product',
          productId: params.productId
        }
      });

      if (error) {
        console.error('Resync Error:', error);
        throw new Error(error.message || 'Falha na re-sincronização');
      }

      return data;
    },
    onSuccess: (data, variables) => {
      // Invalidar caches relevantes
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ML_QUERY_KEYS.products });
      queryClient.invalidateQueries({ queryKey: ['product', variables.productId] });
      
      toast({
        title: "Re-sincronização Concluída",
        description: data?.message || "Produto re-sincronizado com sucesso.",
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
      
      const results = [];
      
      // Processar em lotes de 3 para não sobrecarregar a API
      for (let i = 0; i < params.productIds.length; i += 3) {
        const batch = params.productIds.slice(i, i + 3);
        const batchPromises = batch.map(productId => 
          supabase.functions.invoke('ml-sync-v2', {
            body: { 
              action: 'resync_product',
              productId: productId
            }
          })
        );
        
        const batchResults = await Promise.allSettled(batchPromises);
        results.push(...batchResults);
        
        // Aguardar 1 segundo entre lotes para respeitar rate limits
        if (i + 3 < params.productIds.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      const successful = results.filter(result => result.status === 'fulfilled').length;
      const failed = results.filter(result => result.status === 'rejected').length;

      return {
        total: params.productIds.length,
        successful,
        failed,
        results
      };
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