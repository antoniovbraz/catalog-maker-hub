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
        body: { action: 'get_sync_status' }
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
        name: (item.products as { name?: string } | null)?.name || 'Produto',
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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productIds: string[]): Promise<void> => {
      const { error } = await supabase.functions.invoke('ml-sync', {
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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<void> => {
      const { error } = await supabase.functions.invoke('ml-sync', {
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

export function useMLCreateAd() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { 
      product_id: string;
      title: string;
      description: string;
      price: number;
      available_quantity: number;
      listing_type: string;
      condition: string;
      category_id?: string;
    }): Promise<void> => {
      const { error } = await supabase.functions.invoke('ml-sync', {
        body: { 
          action: 'create_ad',
          ...data
        }
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ML_SYNC_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: "Anúncio Criado",
        description: "Anúncio foi criado no Mercado Livre com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao Criar Anúncio",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useMLLinkProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { 
      product_id: string;
      ml_item_id: string;
    }): Promise<void> => {
      const { error } = await supabase.functions.invoke('ml-sync', {
        body: { 
          action: 'link_product',
          ...data
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