import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { marketplacesService } from "@/services/marketplaces";
import { MarketplaceFormData } from "@/types/marketplaces";
import { toast } from "@/components/ui/use-toast";

export const MARKETPLACES_QUERY_KEY = "marketplaces";

export function useMarketplaces() {
  return useQuery({
    queryKey: [MARKETPLACES_QUERY_KEY],
    queryFn: () => marketplacesService.getAll(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useMarketplacesHierarchical() {
  return useQuery({
    queryKey: [MARKETPLACES_QUERY_KEY, 'hierarchical'],
    queryFn: () => marketplacesService.getHierarchical(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useMarketplacePlatforms() {
  return useQuery({
    queryKey: [MARKETPLACES_QUERY_KEY, 'platforms'],
    queryFn: () => marketplacesService.getPlatforms(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useMarketplaceModalities(platformId?: string, categoryId?: string) {
  return useQuery({
    queryKey: [MARKETPLACES_QUERY_KEY, 'modalities', platformId, categoryId],
    queryFn: () => platformId ? marketplacesService.getModalitiesByPlatform(platformId, categoryId) : Promise.resolve([]),
    enabled: !!platformId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useMarketplace(id: string) {
  return useQuery({
    queryKey: [MARKETPLACES_QUERY_KEY, id],
    queryFn: () => marketplacesService.getById(id),
    enabled: !!id,
  });
}

export function useCreateMarketplace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: MarketplaceFormData) => marketplacesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MARKETPLACES_QUERY_KEY] });
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

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: MarketplaceFormData }) =>
      marketplacesService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MARKETPLACES_QUERY_KEY] });
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

  return useMutation({
    mutationFn: (id: string) => marketplacesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MARKETPLACES_QUERY_KEY] });
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