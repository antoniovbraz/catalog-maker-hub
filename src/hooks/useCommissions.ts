import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { commissionsService } from "@/services/commissions";
import { CommissionFormData, CommissionType, CommissionWithDetails } from "@/types/commissions";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/utils/logger";

const QUERY_KEYS = {
  all: ['commissions'] as const,
  withDetails: ['commissions', 'with-details'] as const,
  byMarketplace: (marketplaceId: string) => ['commissions', 'marketplace', marketplaceId] as const,
  byCategory: (categoryId: string) => ['commissions', 'category', categoryId] as const,
  applicable: (marketplaceId: string, categoryId?: string | null) => 
    ['commissions', 'applicable', marketplaceId, categoryId] as const,
};

export function useCommissions() {
  return useQuery({
    queryKey: QUERY_KEYS.all,
    queryFn: () => commissionsService.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

export function useCommissionsWithDetails() {
  return useQuery({
    queryKey: QUERY_KEYS.withDetails,
    queryFn: () => commissionsService.getAllWithDetails(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCommissionsByMarketplace(marketplaceId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.byMarketplace(marketplaceId),
    queryFn: () => commissionsService.getByMarketplace(marketplaceId),
    enabled: !!marketplaceId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCommissionsByCategory(categoryId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.byCategory(categoryId),
    queryFn: () => commissionsService.getByCategory(categoryId),
    enabled: !!categoryId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useApplicableCommission(marketplaceId: string, categoryId?: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.applicable(marketplaceId, categoryId),
    queryFn: () => commissionsService.findApplicableCommission({ marketplaceId, categoryId }),
    enabled: !!marketplaceId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCommissionRate(marketplaceId: string, categoryId?: string | null) {
  return useQuery({
    queryKey: ['commission-rate', marketplaceId, categoryId],
    queryFn: () => commissionsService.calculateCommissionRate(marketplaceId, categoryId),
    enabled: !!marketplaceId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateCommission() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CommissionFormData) => {
      // Validar se já existe uma regra para esta combinação
      const isUnique = await commissionsService.validateUniqueRule(
        data.marketplace_id, 
        data.category_id || null
      );

      if (!isUnique) {
        throw new Error('Já existe uma comissão para esta combinação de marketplace e categoria');
      }

      return commissionsService.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.withDetails });
      toast({
        title: "Comissão criada",
        description: "A comissão foi criada com sucesso.",
      });
      logger.info('Comissão criada com sucesso', 'useCreateCommission');
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar comissão",
        description: error.message,
        variant: "destructive",
      });
      logger.error('Erro ao criar comissão', 'useCreateCommission', error);
    },
  });
}

export function useUpdateCommission() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CommissionFormData }) => {
      // Validar se já existe uma regra para esta combinação (excluindo a atual)
      const isUnique = await commissionsService.validateUniqueRule(
        data.marketplace_id, 
        data.category_id || null,
        id
      );

      if (!isUnique) {
        throw new Error('Já existe uma comissão para esta combinação de marketplace e categoria');
      }

      return commissionsService.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.withDetails });
      toast({
        title: "Comissão atualizada",
        description: "A comissão foi atualizada com sucesso.",
      });
      logger.info('Comissão atualizada com sucesso', 'useUpdateCommission');
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar comissão",
        description: error.message,
        variant: "destructive",
      });
      logger.error('Erro ao atualizar comissão', 'useUpdateCommission', error);
    },
  });
}

export function useDeleteCommission() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => commissionsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.withDetails });
      toast({
        title: "Comissão excluída",
        description: "A comissão foi excluída com sucesso.",
      });
      logger.info('Comissão excluída com sucesso', 'useDeleteCommission');
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir comissão",
        description: error.message,
        variant: "destructive",
      });
      logger.error('Erro ao excluir comissão', 'useDeleteCommission', error);
    },
  });
}