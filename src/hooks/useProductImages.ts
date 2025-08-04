import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adsService } from "@/services/ads";
import { useToast } from "@/components/ui/use-toast";
import { logger } from "@/utils/logger";

const QUERY_KEYS = {
  productImages: (productId: string) => ['product-images', productId] as const,
  imageCount: (productId: string) => ['product-images', 'count', productId] as const,
};

export function useProductImages(productId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.productImages(productId),
    queryFn: () => adsService.getProductImages(productId),
    enabled: !!productId,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

export function useProductImagesCount(productId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.imageCount(productId),
    queryFn: () => adsService.getProductImagesCount(productId),
    enabled: !!productId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

export function useUploadProductImage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      productId, 
      file, 
      imageType = 'product', 
      sortOrder = 0 
    }: { 
      productId: string; 
      file: File; 
      imageType?: string; 
      sortOrder?: number;
    }) => {
      return adsService.uploadProductImage(productId, file, imageType, sortOrder);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.productImages(variables.productId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.imageCount(variables.productId) });
      toast({
        title: "Imagem carregada",
        description: "A imagem foi carregada com sucesso.",
      });
      logger.info('Upload de imagem concluído', 'useUploadProductImage');
    },
    onError: (error: Error) => {
      toast({
        title: "Erro no upload",
        description: error.message,
        variant: "destructive",
      });
      logger.error('Erro no upload de imagem', 'useUploadProductImage', error);
    },
  });
}

export function useDeleteProductImage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (imageId: string) => adsService.deleteProductImage(imageId),
    onSuccess: () => {
      // Invalidar todas as queries de imagens
      queryClient.invalidateQueries({ queryKey: ['product-images'] });
      toast({
        title: "Imagem excluída",
        description: "A imagem foi excluída com sucesso.",
      });
      logger.info('Imagem excluída com sucesso', 'useDeleteProductImage');
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
      logger.error('Erro ao excluir imagem', 'useDeleteProductImage', error);
    },
  });
}

export function useReorderProductImages() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ 
      productId, 
      imageOrders 
    }: { 
      productId: string; 
      imageOrders: { id: string; sort_order: number }[];
    }) => {
      return adsService.reorderImages(productId, imageOrders);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.productImages(variables.productId) });
      toast({
        title: "Ordem atualizada",
        description: "A ordem das imagens foi atualizada.",
      });
      logger.info('Ordem das imagens atualizada', 'useReorderProductImages');
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao reordenar",
        description: error.message,
        variant: "destructive",
      });
      logger.error('Erro ao reordenar imagens', 'useReorderProductImages', error);
    },
  });
}