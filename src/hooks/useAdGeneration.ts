import { useMutation } from "@tanstack/react-query";
import { adsService } from "@/services/ads";
import { AdGenerationRequest } from "@/types/ads";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/utils/logger";

export function useGenerateListing() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: (request: AdGenerationRequest) => adsService.generateListing(request),
    onSuccess: (result) => {
      toast({
        title: "Anúncio gerado!",
        description: "O anúncio foi gerado com sucesso. Revise antes de publicar.",
      });
      logger.info('Anúncio gerado com sucesso', { source: 'useGenerateListing', result });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro na geração",
        description: error.message,
        variant: "destructive",
      });
      logger.error('Erro na geração de anúncio', error, { source: 'useGenerateListing' });
    },
  });
}

export function useGenerateDescription() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ 
      productId, 
      imageUrls, 
      marketplace 
    }: { 
      productId: string; 
      imageUrls: string[]; 
      marketplace: string;
    }) => {
      return adsService.generateDescription(productId, imageUrls, marketplace);
    },
    onSuccess: () => {
      toast({
        title: "Descrição gerada!",
        description: "A descrição foi gerada com sucesso.",
      });
      logger.info('Descrição gerada com sucesso', { source: 'useGenerateDescription' });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro na geração",
        description: error.message,
        variant: "destructive",
      });
      logger.error('Erro na geração de descrição', error, { source: 'useGenerateDescription' });
    },
  });
}