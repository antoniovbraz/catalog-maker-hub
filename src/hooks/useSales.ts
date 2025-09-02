import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { salesService } from "@/services/sales";
import { SaleFormData } from "@/types/sales";
import { toast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';

export const SALES_QUERY_KEY = "sales";

export function useSales() {
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id;
  return useQuery({
    queryKey: [SALES_QUERY_KEY, tenantId],
    queryFn: () => salesService.getAllWithDetails(),
    enabled: !!tenantId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSale(id: string) {
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id;
  return useQuery({
    queryKey: [SALES_QUERY_KEY, tenantId, id],
    queryFn: () => salesService.getById(id),
    enabled: !!id && !!tenantId,
  });
}

export function useCreateSale() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id;

  return useMutation({
    mutationFn: (data: SaleFormData) => salesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SALES_QUERY_KEY, tenantId] });
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
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id;

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SaleFormData }) =>
      salesService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SALES_QUERY_KEY, tenantId] });
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
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id;

  return useMutation({
    mutationFn: (id: string) => salesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [SALES_QUERY_KEY, tenantId] });
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