// DEPRECATED: Use useMLIntegration and useMLAuth from useMLIntegration.ts instead
// This file is kept for backwards compatibility during refactoring

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

// Re-export from new service (renamed to avoid conflict)
export { 
  useMLIntegration, 
  useMLAuth as useMLAuthNew, 
  useMLConnectionStatus 
} from './useMLIntegration';

export interface MLAuthStatus {
  connected: boolean;
  user_id_ml?: number;
  ml_nickname?: string;
  access_token?: string;
  expires_at?: string;
  error?: string;
}

export const ML_AUTH_QUERY_KEY = "ml-auth";

// Legacy hook - redirect to new implementation with compatibility layer
export function useMLAuth() {
  console.warn('DEPRECATED: useMLAuth - Use useMLIntegration().auth instead');
  
  const errorShownRef = useRef(false);
  const lastErrorTime = useRef(0);
  const consecutiveErrors = useRef(0);
  
  const query = useQuery({
    queryKey: [ML_AUTH_QUERY_KEY],
    queryFn: async (): Promise<MLAuthStatus> => {
      if (consecutiveErrors.current > 2) {
        const backoffTime = Math.min(30000, 5000 * Math.pow(2, consecutiveErrors.current - 3));
        const timeSinceLastError = Date.now() - lastErrorTime.current;
        
        if (timeSinceLastError < backoffTime) {
          throw new Error(`Sistema em pausa. Aguarde ${Math.ceil((backoffTime - timeSinceLastError) / 1000)} segundos.`);
        }
      }

      try {
        const { data, error } = await supabase.functions.invoke('ml-auth', {
          body: { action: 'status' }
        });

        if (error) {
          consecutiveErrors.current++;
          lastErrorTime.current = Date.now();
          throw new Error(error.message || 'Erro na verificação do Mercado Livre');
        }
        
        consecutiveErrors.current = 0;
        
        // Adaptar resposta para formato antigo
        return {
          connected: data?.connected || false,
          user_id_ml: data?.user_id_ml,
          ml_nickname: data?.ml_nickname,
          expires_at: data?.expires_at,
        };
      } catch (err) {
        if (!err.message.includes('Sistema em pausa')) {
          consecutiveErrors.current++;
          lastErrorTime.current = Date.now();
        }
        throw err;
      }
    },
    staleTime: 20 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    enabled: consecutiveErrors.current <= 5,
  });

  // Handle errors com debounce
  useEffect(() => {
    if (query.error && !errorShownRef.current) {
      const now = Date.now();
      const debounceTime = Math.min(15000, 3000 * consecutiveErrors.current);
      
      if (now - lastErrorTime.current > debounceTime) {
        errorShownRef.current = true;
        
        const getErrorMessage = () => {
          if (consecutiveErrors.current > 4) {
            return "Sistema Mercado Livre temporariamente indisponível. Aguarde.";
          }
          if (query.error.message.includes('Sistema em pausa')) {
            return query.error.message;
          }
          if (query.error.message.includes('Authorization')) {
            return "Sessão expirada. Faça login novamente.";
          }
          return query.error.message;
        };
        
        toast({
          title: "Integração Mercado Livre",
          description: getErrorMessage(),
          variant: "destructive",
        });
        
        const resetTime = Math.min(120000, 30000 * Math.max(1, consecutiveErrors.current - 2));
        setTimeout(() => {
          errorShownRef.current = false;
        }, resetTime);
      }
    }
  }, [query.error]);

  return query;
}

export function useMLAuthStart() {
  console.warn('DEPRECATED: useMLAuthStart - Use useMLAuth().startAuth instead');
  
  return useMutation({
    mutationFn: async (): Promise<{ auth_url: string; state: string }> => {
      const { data, error } = await supabase.functions.invoke('ml-auth', {
        body: { action: 'start_auth' }
      });

      if (error) {
        throw new Error(error.message || "Falha ao iniciar autenticação com Mercado Livre");
      }

      return data;
    },
    onSuccess: (data) => {
      window.location.href = data.auth_url;
    },
    onError: (error: Error) => {
      toast({
        title: "Erro na Autenticação",
        description: error.message.includes('PKCE') 
          ? "Erro técnico na configuração. Tente novamente." 
          : error.message,
        variant: "destructive",
      });
    },
  });
}

export function useMLAuthCallback() {
  console.warn('DEPRECATED: useMLAuthCallback - Use useMLAuth().handleCallback instead');
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (code: string): Promise<void> => {
      const urlParams = new URLSearchParams(window.location.search);
      const state = urlParams.get('state');

      if (!state) {
        throw new Error('Estado de autenticação não encontrado. Tente o processo novamente.');
      }

      const { error } = await supabase.functions.invoke('ml-auth', {
        body: { action: 'handle_callback', code, state }
      });

      if (error) {
        if (error.message.includes('PKCE')) {
          throw new Error('Erro na verificação de segurança. Reinicie o processo de conexão.');
        }
        if (error.message.includes('expired')) {
          throw new Error('Sessão de autenticação expirada. Tente conectar novamente.');
        }
        if (error.message.includes('code_verifier')) {
          throw new Error('Erro técnico na autenticação. Tente novamente.');
        }
        
        throw new Error(error.message || 'Falha na conexão com Mercado Livre');
      }
    },
    retry: 0,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ML_AUTH_QUERY_KEY] });
      toast({
        title: "Conexão Realizada!",
        description: "Sua conta do Mercado Livre foi conectada com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro na Conexão",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useMLAuthRefresh() {
  console.warn('DEPRECATED: useMLAuthRefresh - Use useMLAuth().refreshToken instead');
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<void> => {
      const { error } = await supabase.functions.invoke('ml-auth', {
        body: { action: 'refresh_token' }
      });

      if (error) {
        if (error.message.includes('not found')) {
          throw new Error('Token não encontrado. Faça uma nova conexão.');
        }
        if (error.message.includes('refresh_token')) {
          throw new Error('Token de renovação inválido. Reconecte sua conta.');
        }
        
        throw new Error(error.message || 'Falha na renovação do token');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ML_AUTH_QUERY_KEY] });
      toast({
        title: "Token Renovado",
        description: "Acesso ao Mercado Livre renovado com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro na Renovação",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

// Exportar hook de desconexão
export { useMLAuthDisconnect } from "./useMLAuthDisconnect";