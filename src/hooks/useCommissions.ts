import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { commissionsService } from "@/services/commissions";
import { CommissionFormData } from "@/types/commissions";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/utils/logger";
import { useAuth } from '@/contexts/AuthContext';

const QUERY_KEYS = {
  all: (tenantId: string | undefined) => ['commissions', tenantId] as const,
  withDetails: (tenantId: string | undefined) => ['commissions', tenantId, 'with-details'] as const,
  byMarketplace: (tenantId: string | undefined, marketplaceId: string) => ['commissions', tenantId, 'marketplace', marketplaceId] as const,
  byCategory: (tenantId: string | undefined, categoryId: string) => ['commissions', tenantId, 'category', categoryId] as const,
  applicable: (tenantId: string | undefined, marketplaceId: string, categoryId?: string | null) =>
    ['commissions', tenantId, 'applicable', marketplaceId, categoryId] as const,
};

export function useCommissions() {
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id;
  return useQuery({
    queryKey: QUERY_KEYS.all(tenantId),
    queryFn: () => commissionsService.getAll(),
    enabled: !!tenantId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

export function useCommissionsWithDetails() {
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id;
  return useQuery({
    queryKey: QUERY_KEYS.withDetails(tenantId),
    queryFn: () => commissionsService.getAllWithDetails(),
    enabled: !!tenantId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCommissionsByMarketplace(marketplaceId: string) {
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id;
  return useQuery({
    queryKey: QUERY_KEYS.byMarketplace(tenantId, marketplaceId),
    queryFn: () => commissionsService.getByMarketplace(marketplaceId),
    enabled: !!marketplaceId && !!tenantId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCommissionsByCategory(categoryId: string) {
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id;
  return useQuery({
    queryKey: QUERY_KEYS.byCategory(tenantId, categoryId),
    queryFn: () => commissionsService.getByCategory(categoryId),
    enabled: !!categoryId && !!tenantId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useApplicableCommission(marketplaceId: string, categoryId?: string | null) {
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id;
  return useQuery({
    queryKey: QUERY_KEYS.applicable(tenantId, marketplaceId, categoryId),
    queryFn: () => commissionsService.findApplicableCommission({ marketplaceId, categoryId }),
    enabled: !!marketplaceId && !!tenantId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCommissionRate(marketplaceId: string, categoryId?: string | null) {
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id;
  return useQuery({
    queryKey: ['commission-rate', tenantId, marketplaceId, categoryId],
    queryFn: () => commissionsService.calculateCommissionRate(marketplaceId, categoryId),
    enabled: !!marketplaceId && !!tenantId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateCommission() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id;

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
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all(tenantId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.withDetails(tenantId) });
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
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id;

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
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all(tenantId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.withDetails(tenantId) });
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
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id;

  return useMutation({
    mutationFn: (id: string) => commissionsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.all(tenantId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.withDetails(tenantId) });
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