import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface MLCategoryMapping {
  id: string;
  tenant_id: string;
  category_id?: string;
  ml_category_id: string;
  ml_category_name: string;
  description?: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  categories?: {
    id: string;
    name: string;
  };
}

export interface PopularMLCategory {
  ml_category_id: string;
  ml_category_name: string;
  usage_count: number;
}

const ML_CATEGORY_MAPPING_QUERY_KEY = 'ml-category-mappings';

export function useMLCategoryMappings() {
  return useQuery({
    queryKey: [ML_CATEGORY_MAPPING_QUERY_KEY],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ml_category_mapping')
        .select(`
          *,
          categories(id, name)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Erro ao buscar mapeamentos: ${error.message}`);
      }

      return data as MLCategoryMapping[];
    },
  });
}

export function usePopularMLCategories() {
  return useQuery({
    queryKey: ['popular-ml-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_popular_ml_categories');

      if (error) {
        console.error('Erro ao buscar categorias populares:', error);
        return [];
      }

      return data as PopularMLCategory[];
    },
    staleTime: 30 * 60 * 1000, // 30 minutos
  });
}

export function useCreateMLCategoryMapping() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (mapping: Omit<MLCategoryMapping, 'id' | 'tenant_id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('ml_category_mapping')
        .insert([mapping])
        .select()
        .single();

      if (error) {
        throw new Error(`Erro ao criar mapeamento: ${error.message}`);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ML_CATEGORY_MAPPING_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['popular-ml-categories'] });
      toast({
        title: "Mapeamento criado",
        description: "Mapeamento de categoria criado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar mapeamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateMLCategoryMapping() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...mapping }: Partial<MLCategoryMapping> & { id: string }) => {
      const { data, error } = await supabase
        .from('ml_category_mapping')
        .update(mapping)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Erro ao atualizar mapeamento: ${error.message}`);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ML_CATEGORY_MAPPING_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['popular-ml-categories'] });
      toast({
        title: "Mapeamento atualizado",
        description: "Mapeamento de categoria atualizado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar mapeamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteMLCategoryMapping() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('ml_category_mapping')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Erro ao excluir mapeamento: ${error.message}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ML_CATEGORY_MAPPING_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['popular-ml-categories'] });
      toast({
        title: "Mapeamento excluído",
        description: "Mapeamento de categoria excluído com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir mapeamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useSyncMLCategoryMapping() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ml_category_id,
      ml_category_name,
      category_id,
    }: {
      ml_category_id: string;
      ml_category_name: string;
      category_id?: string;
    }) => {
      const { data, error } = await supabase
        .rpc('sync_ml_category_mapping', {
          p_ml_category_id: ml_category_id,
          p_ml_category_name: ml_category_name,
          p_category_id: category_id || null,
        });

      if (error) {
        throw new Error(`Erro ao sincronizar mapeamento: ${error.message}`);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ML_CATEGORY_MAPPING_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['popular-ml-categories'] });
      toast({
        title: "Mapeamento sincronizado",
        description: "Categoria do Mercado Livre mapeada automaticamente.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro na sincronização",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}