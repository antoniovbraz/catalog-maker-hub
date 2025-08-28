import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface MLSyncProduct {
  id: string;
  name: string;
  ml_item_id?: string;
  sync_status: 'not_synced' | 'syncing' | 'synced' | 'error';
  last_sync_at?: string;
  error_message?: string;
}

export interface MLSyncStatus {
  total_products: number;
  synced_products: number;
  pending_products: number;
  error_products: number;
  last_sync_at?: string;
}

export const ML_SYNC_QUERY_KEY = "ml-sync";

export function useMLSyncStatus() {
  return useQuery({
    queryKey: [ML_SYNC_QUERY_KEY, 'status'],
    queryFn: async (): Promise<MLSyncStatus> => {
      const { data, error } = await supabase.functions.invoke('ml-sync', {
        body: { action: 'sync-status' }
      });

      if (error) throw error;
      return data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useMLSyncProducts() {
  return useQuery({
    queryKey: [ML_SYNC_QUERY_KEY, 'products'],
    queryFn: async (): Promise<MLSyncProduct[]> => {
      const { data, error } = await supabase
        .from('ml_product_mapping')
        .select(`
          product_id,
          ml_item_id,
          sync_status,
          last_sync_at,
          error_message,
          products (
            id,
            name
          )
        `)
        .order('last_sync_at', { ascending: false });

      if (error) throw error;

      return data.map(item => ({
        id: item.product_id,
        name: (item.products as any)?.name || 'Produto',
        ml_item_id: item.ml_item_id,
        sync_status: item.sync_status as MLSyncProduct['sync_status'],
        last_sync_at: item.last_sync_at,
        error_message: item.error_message,
      }));
    },
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useMLSyncProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string): Promise<void> => {
      const { error } = await supabase.functions.invoke('ml-sync', {
        body: { 
          action: 'sync-product',
          product_id: productId
        }
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ML_SYNC_QUERY_KEY] });
      toast({
        title: "Sincronização Iniciada",
        description: "Produto está sendo sincronizado com o Mercado Livre",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro na Sincronização",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useMLSyncBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productIds: string[]): Promise<void> => {
      const { error } = await supabase.functions.invoke('ml-sync', {
        body: { 
          action: 'sync-batch',
          product_ids: productIds
        }
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ML_SYNC_QUERY_KEY] });
      toast({
        title: "Sincronização em Lote Iniciada",
        description: "Produtos estão sendo sincronizados com o Mercado Livre",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro na Sincronização em Lote",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}