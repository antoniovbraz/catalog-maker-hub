import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assistantsService } from '@/services/assistants';
import type { Assistant, AssistantFormData } from '@/types/assistants';
import { useToast } from '@/components/ui/use-toast';
import { useLogger } from '@/utils/logger';

const ASSISTANTS_QUERY_KEY = ['assistants'] as const;

export function useAssistants() {
  const logger = useLogger('useAssistants');

  return useQuery({
    queryKey: ASSISTANTS_QUERY_KEY,
    queryFn: () => assistantsService.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

export function useCreateAssistant() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const logger = useLogger('useCreateAssistant');

  return useMutation({
    mutationFn: (data: AssistantFormData) => assistantsService.createAssistant(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ASSISTANTS_QUERY_KEY });
      toast({
        title: "Assistente criado",
        description: `${data.name} foi criado com sucesso.`,
      });
      logger.info('Assistente criado com sucesso', data);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar assistente",
        description: error.message,
        variant: "destructive",
      });
      logger.error('Erro ao criar assistente', error);
    },
  });
}

export function useUpdateAssistant() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const logger = useLogger('useUpdateAssistant');

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AssistantFormData> }) =>
      assistantsService.updateAssistant(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ASSISTANTS_QUERY_KEY });
      toast({
        title: "Assistente atualizado",
        description: `${data.name} foi atualizado com sucesso.`,
      });
      logger.info('Assistente atualizado com sucesso', data);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar assistente",
        description: error.message,
        variant: "destructive",
      });
      logger.error('Erro ao atualizar assistente', error);
    },
  });
}

export function useDeleteAssistant() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const logger = useLogger('useDeleteAssistant');

  return useMutation({
    mutationFn: (id: string) => assistantsService.deleteAssistant(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ASSISTANTS_QUERY_KEY });
      toast({
        title: "Assistente removido",
        description: "O assistente foi removido com sucesso.",
      });
      logger.info('Assistente removido com sucesso');
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao remover assistente",
        description: error.message,
        variant: "destructive",
      });
      logger.error('Erro ao remover assistente', error);
    },
  });
}

export function useAssistantByMarketplace(marketplace: string) {
  const logger = useLogger('useAssistantByMarketplace');

  return useQuery({
    queryKey: ['assistants', 'marketplace', marketplace],
    queryFn: () => assistantsService.getAssistantByMarketplace(marketplace),
    enabled: !!marketplace,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}