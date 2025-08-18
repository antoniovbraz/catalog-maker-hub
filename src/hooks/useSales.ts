import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { salesService } from "@/services/sales";
import { SaleFormData } from "@/types/sales";
import { toast } from "@/hooks/use-toast";

export const SALES_QUERY_KEY = "sales";

export function useSales() {
  return useQuery({
    queryKey: [SALES_QUERY_KEY],
    queryFn: () => salesService.getAllWithDetails(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useSale(id: string) {
  return useQuery({
    queryKey: [SALES_QUERY_KEY, id],
    queryFn: () => salesService.getById(id),
    enabled: !!id,
  });
}

export function useCreateSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SaleFormData) => salesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SALES_QUERY_KEY] });
      toast({
        title: "Sucesso",
        description: "Venda registrada com sucesso!",
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

export function useUpdateSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SaleFormData }) =>
      salesService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SALES_QUERY_KEY] });
      toast({
        title: "Sucesso",
        description: "Venda atualizada com sucesso!",
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

export function useDeleteSale() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => salesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SALES_QUERY_KEY] });
      toast({
        title: "Sucesso",
        description: "Venda deletada com sucesso!",
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