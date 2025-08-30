import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface MLAuthStatus {
  connected: boolean;
  user_id_ml?: number;
  access_token?: string;
  expires_at?: string;
  error?: string;
}

export const ML_AUTH_QUERY_KEY = "ml-auth";

export function useMLAuth() {
  const errorShownRef = useRef(false);
  const lastErrorTime = useRef(0);
  const errorCount = useRef(0);
  
  const query = useQuery({
    queryKey: [ML_AUTH_QUERY_KEY],
    queryFn: async (): Promise<MLAuthStatus> => {
      // Circuit breaker: Se muitos erros consecutivos, parar tentativas
      if (errorCount.current > 3) {
        const timeSinceLastError = Date.now() - lastErrorTime.current;
        if (timeSinceLastError < 60000) { // 1 minuto de cooldown
          throw new Error('Muitas tentativas falhas. Aguarde antes de tentar novamente.');
        } else {
          errorCount.current = 0; // Reset após cooldown
        }
      }

      const { data, error } = await supabase.functions.invoke('ml-auth', {
        body: { action: 'get_status' }
      });

      if (error) {
        errorCount.current++;
        lastErrorTime.current = Date.now();
        throw error;
      }
      
      // Reset error count em caso de sucesso
      errorCount.current = 0;
      return data;
    },
    staleTime: 15 * 60 * 1000, // 15 minutos - aumentar ainda mais
    retry: false, // Completamente desabilitar retry automático
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false, // Não tentar reconectar automaticamente
    enabled: errorCount.current <= 3, // Desabilitar query se muitos erros
  });

  // Handle errors with debounce e circuit breaker
  useEffect(() => {
    if (query.error && !errorShownRef.current) {
      const now = Date.now();
      
      // Debounce: Só mostrar erro se passou tempo suficiente
      if (now - lastErrorTime.current > 5000) {
        errorShownRef.current = true;
        
        toast({
          title: "Erro na verificação ML",
          description: errorCount.current > 3 
            ? "Muitas tentativas falhas. Sistema em pausa." 
            : query.error.message,
          variant: "destructive",
        });
        
        // Reset após tempo maior para evitar spam
        setTimeout(() => {
          errorShownRef.current = false;
        }, 60000); // 1 minuto
      }
    }
  }, [query.error]);

  return query;
}

export function useMLAuthStart() {
  return useMutation({
    mutationFn: async (): Promise<{ auth_url: string; state: string }> => {
      const { data, error } = await supabase.functions.invoke('ml-auth', {
        body: { action: 'start_auth' }
      });

      if (error) {
        throw new Error(error.message || "Failed to start auth");
      }

      return data;
    },
    onSuccess: (data) => {
      // Redirect to ML OAuth
      window.location.href = data.auth_url;
    },
    onError: (error: Error) => {
      toast({
        title: "Erro na Autenticação",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useMLAuthCallback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (code: string): Promise<void> => {
      // Get current URL parameters to extract state
      const urlParams = new URLSearchParams(window.location.search);
      const state = urlParams.get('state');

      const { error } = await supabase.functions.invoke('ml-auth', {
        body: { action: 'handle_callback', code, state }
      });

      if (error) {
        throw new Error(error.message || 'Failed to handle callback');
      }
    },
    retry: 0,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ML_AUTH_QUERY_KEY] });
      toast({
        title: "Sucesso",
        description: "Conta do Mercado Livre conectada com sucesso!",
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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<void> => {
      const { error } = await supabase.functions.invoke('ml-auth', {
        body: { action: 'refresh_token' }
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ML_AUTH_QUERY_KEY] });
      toast({
        title: "Token Atualizado",
        description: "Token de acesso renovado com sucesso!",
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