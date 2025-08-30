import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { productsService } from "@/services/products";
import { ProductFormData, ProductWithCategory } from "@/types/products";
import { toast } from "@/hooks/use-toast";

export const PRODUCTS_QUERY_KEY = "products";

export function useProducts() {
  return useQuery({
    queryKey: [PRODUCTS_QUERY_KEY],
    queryFn: () => productsService.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

export function useProductsWithCategories() {
  return useQuery({
    queryKey: [PRODUCTS_QUERY_KEY, "with-categories"],
    queryFn: () => productsService.getAllWithCategories(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useProduct(id: string) {
  return useQuery<ProductWithCategory>({
    queryKey: [PRODUCTS_QUERY_KEY, id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories:category_id (
            id,
            name
          )
        `)
        .eq('id', id)
        .single();
      
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ProductFormData) => productsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_QUERY_KEY] });
      toast({
        title: "Sucesso",
        description: "Produto criado com sucesso!",
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

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProductFormData }) =>
      productsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_QUERY_KEY] });
      toast({
        title: "Sucesso",
        description: "Produto atualizado com sucesso!",
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

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => productsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_QUERY_KEY] });
      toast({
        title: "Sucesso",
        description: "Produto deletado com sucesso!",
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