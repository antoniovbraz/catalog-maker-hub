// DEPRECATED: Use useMLIntegration and useMLSync from useMLIntegration.ts instead
// This file is kept for backwards compatibility during refactoring

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

// Re-export from new service
export { useMLIntegration, useMLSync, ML_QUERY_KEYS } from './useMLIntegration';

// Legacy types for backwards compatibility
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

// Query key for backwards compatibility
export const ML_SYNC_QUERY_KEY = "ml-sync";

// Legacy hooks - redirect to new implementation
export function useMLSyncStatus() {
  console.warn('DEPRECATED: useMLSyncStatus - Use useMLIntegration().sync instead');
  
  return useQuery({
    queryKey: [ML_SYNC_QUERY_KEY, 'status'],
    queryFn: async (): Promise<MLSyncStatus> => {
      const { data, error } = await supabase.functions.invoke('ml-sync-v2', {
        body: { action: 'get_sync_status' }
      });

      if (error) throw error;
      
      // Adaptar para formato antigo
      const result = data.status_counts;
      return {
        total_products: result.total,
        synced_products: result.synced,
        pending_products: result.pending,
        error_products: result.error,
        last_sync_at: new Date().toISOString()
      };
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function useMLSyncProducts() {
  console.warn('DEPRECATED: useMLSyncProducts - Use useMLIntegration().sync instead');
  
  return useQuery({
    queryKey: [ML_SYNC_QUERY_KEY, 'products'],
    queryFn: async (): Promise<MLSyncProduct[]> => {
      const { data, error } = await supabase.functions.invoke('ml-sync-v2', {
        body: { action: 'get_sync_status' }
      });

      if (error) throw error;
      
      return data.products.map((item: any) => ({
        id: item.id,
        name: item.name,
        ml_item_id: item.ml_item_id,
        sync_status: item.sync_status,
        last_sync_at: item.last_sync_at,
        error_message: item.error_message,
      }));
    },
    staleTime: 30 * 1000,
  });
}

export function useMLSyncProduct() {
  console.warn('DEPRECATED: useMLSyncProduct - Use useMLSync().syncProduct instead');
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: string): Promise<void> => {
      const { error } = await supabase.functions.invoke('ml-sync-v2', {
        body: { 
          action: 'sync_product',
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
  console.warn('DEPRECATED: useMLSyncBatch - Use useMLSync().syncBatch instead');
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productIds: string[]): Promise<void> => {
      const { error } = await supabase.functions.invoke('ml-sync-v2', {
        body: { 
          action: 'sync_batch',
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

export function useMLImportProducts() {
  console.warn('DEPRECATED: useMLImportProducts - Use useMLSync().importFromML instead');
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<void> => {
      const { error } = await supabase.functions.invoke('ml-sync-v2', {
        body: { 
          action: 'import_from_ml'
        }
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ML_SYNC_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: "Importação Iniciada",
        description: "Produtos do Mercado Livre estão sendo importados",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro na Importação",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useMLLinkProduct() {
  console.warn('DEPRECATED: useMLLinkProduct - Use useMLSync().linkProduct instead');
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { 
      product_id: string;
      ml_item_id: string;
    }): Promise<void> => {
      const { error } = await supabase.functions.invoke('ml-sync-v2', {
        body: { 
          action: 'link_product',
          product_id: data.product_id,
          ml_item_id: data.ml_item_id
        }
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ML_SYNC_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: "Produto Vinculado",
        description: "Produto foi vinculado ao anúncio do Mercado Livre",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao Vincular Produto",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useMLCreateAd() {
  console.warn('DEPRECATED: useMLCreateAd - Use useMLSync().createAd instead');
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      productId, 
      title, 
      price, 
      description,
      categoryId,
      images = []
    }: {
      productId: string;
      title: string;
      price: number;
      description?: string;
      categoryId?: string;
      images?: string[];
    }) => {
      const { data, error } = await supabase.functions.invoke('ml-sync-v2', {
        body: { 
          action: 'create_ad',
          product_id: productId,
          ad_data: {
            title,
            price,
            description,
            category_id: categoryId || 'MLB1051',
            images,
          }
        }
      });

      if (error) {
        throw new Error(error.message || 'Falha ao criar anúncio no Mercado Livre');
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [ML_SYNC_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      
      toast({
        title: "Anúncio criado",
        description: `Anúncio criado no Mercado Livre: ${data.ml_permalink || 'Ver no ML'}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar anúncio",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}