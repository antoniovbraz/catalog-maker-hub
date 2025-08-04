import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { logger } from '@/utils/logger';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatRequest {
  thread_id?: string;
  message: string;
  product_info?: any;
  marketplace: string;
  is_initial_message?: boolean;
}

interface ChatResponse {
  thread_id: string;
  response: string;
  status: 'completed' | 'error';
}

export function useAdChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [threadId, setThreadId] = useState<string | null>(null);
  const { toast } = useToast();

  const chatMutation = useMutation({
    mutationFn: async (request: ChatRequest): Promise<ChatResponse> => {
      const { data, error } = await supabase.functions.invoke('generate-ad-chat', {
        body: {
          thread_id: threadId,
          ...request
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      return data;
    },
    onSuccess: (data, variables) => {
      // Salvar thread_id se for nova
      if (data.thread_id && !threadId) {
        setThreadId(data.thread_id);
      }

      // Adicionar mensagem do usuário
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: variables.message,
        timestamp: new Date()
      };

      // Adicionar resposta do assistente
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, userMessage, assistantMessage]);
      
      logger.info('Chat message enviada com sucesso', 'useAdChat');
    },
    onError: (error: Error) => {
      toast({
        title: "Erro no chat",
        description: error.message,
        variant: "destructive",
      });
      logger.error('Erro no chat', 'useAdChat', error);
    },
  });

  const sendMessage = (message: string, productInfo?: any, marketplace: string = 'mercado_livre') => {
    const isInitial = messages.length === 0;
    
    chatMutation.mutate({
      message,
      product_info: isInitial ? productInfo : undefined,
      marketplace,
      is_initial_message: isInitial
    });
  };

  const resetChat = () => {
    setMessages([]);
    setThreadId(null);
  };

  return {
    messages,
    sendMessage,
    resetChat,
    isLoading: chatMutation.isPending,
    error: chatMutation.error
  };
}