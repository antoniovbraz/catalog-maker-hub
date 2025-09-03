import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { marketplacesService } from "@/services/marketplaces";
import { MarketplaceFormData, MarketplaceType } from "@/types/marketplaces";
import { toast } from "@/hooks/use-toast";
import { useAuth } from '@/contexts/AuthContext';

export const MARKETPLACES_QUERY_KEY = "marketplaces";

export function useMarketplaces() {
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id;
  return useQuery({
    queryKey: [MARKETPLACES_QUERY_KEY, tenantId],
    queryFn: () => marketplacesService.getAll(),
    enabled: !!tenantId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useMarketplacesHierarchical() {
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id;
  return useQuery({
    queryKey: [MARKETPLACES_QUERY_KEY, tenantId, 'hierarchical'],
    queryFn: () => marketplacesService.getHierarchical(),
    enabled: !!tenantId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useMarketplacePlatforms() {
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id;
  return useQuery({
    queryKey: [MARKETPLACES_QUERY_KEY, tenantId, 'platforms'],
    queryFn: () => marketplacesService.getPlatforms(),
    enabled: !!tenantId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useMarketplaceModalities(platformId?: string, categoryId?: string) {
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id;
  return useQuery({
    queryKey: [MARKETPLACES_QUERY_KEY, tenantId, 'modalities', platformId, categoryId],
    queryFn: () => platformId ? marketplacesService.getModalitiesByPlatform(platformId, categoryId) : Promise.resolve([]),
    enabled: !!platformId && !!tenantId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useMarketplace(id: string) {
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id;
  return useQuery({
    queryKey: [MARKETPLACES_QUERY_KEY, tenantId, id],
    queryFn: () => marketplacesService.getById(id),
    enabled: !!id && !!tenantId,
  });
}

export function useCreateMarketplace() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id;

  return useMutation({
    mutationFn: (data: MarketplaceFormData) =>
      marketplacesService.create(data as unknown as MarketplaceType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MARKETPLACES_QUERY_KEY, tenantId] });
      toast({
        title: "Sucesso",
        description: "Marketplace criado com sucesso!",
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

export function useUpdateMarketplace() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id;

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: MarketplaceFormData }) =>
      marketplacesService.update(id, data as unknown as MarketplaceType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MARKETPLACES_QUERY_KEY, tenantId] });
      toast({
        title: "Sucesso",
        description: "Marketplace atualizado com sucesso!",
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

export function useDeleteMarketplace() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id;

  return useMutation({
    mutationFn: (id: string) => marketplacesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MARKETPLACES_QUERY_KEY, tenantId] });
      toast({
        title: "Sucesso",
        description: "Marketplace deletado com sucesso!",
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