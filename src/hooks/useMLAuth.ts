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
  const consecutiveErrors = useRef(0);
  
  const query = useQuery({
    queryKey: [ML_AUTH_QUERY_KEY],
    queryFn: async (): Promise<MLAuthStatus> => {
      // Circuit breaker melhorado: Progressive backoff
      if (consecutiveErrors.current > 2) {
        const backoffTime = Math.min(30000, 5000 * Math.pow(2, consecutiveErrors.current - 3)); // Max 30s
        const timeSinceLastError = Date.now() - lastErrorTime.current;
        
        if (timeSinceLastError < backoffTime) {
          console.log(`ML Auth: Circuit breaker ativo. Aguardando ${Math.ceil((backoffTime - timeSinceLastError) / 1000)}s`);
          throw new Error(`Sistema em pausa. Aguarde ${Math.ceil((backoffTime - timeSinceLastError) / 1000)} segundos.`);
        }
      }

      try {
        const { data, error } = await supabase.functions.invoke('ml-auth', {
          body: { action: 'get_status' }
        });

        if (error) {
          consecutiveErrors.current++;
          lastErrorTime.current = Date.now();
          
          // Log detalhado do erro para debugging
          console.error('ML Auth Query Error:', {
            error,
            consecutiveErrors: consecutiveErrors.current,
            timestamp: new Date().toISOString()
          });
          
          throw new Error(error.message || 'Erro na verificação do Mercado Livre');
        }
        
        // Reset counters em caso de sucesso
        consecutiveErrors.current = 0;
        errorCount.current = 0;
        
        return data;
      } catch (err) {
        // Incrementar contadores apenas se não for erro de circuit breaker
        if (!err.message.includes('Sistema em pausa')) {
          consecutiveErrors.current++;
          lastErrorTime.current = Date.now();
        }
        throw err;
      }
    },
    staleTime: 20 * 60 * 1000, // CRÍTICO: 20 minutos para evitar requests frequentes
    gcTime: 30 * 60 * 1000, // 30 minutos de cache
    retry: false, // NUNCA fazer retry automático
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    enabled: consecutiveErrors.current <= 5, // Desabilitar após 5 erros consecutivos
  });

  // Handle errors com debounce inteligente e circuit breaker
  useEffect(() => {
    if (query.error && !errorShownRef.current) {
      const now = Date.now();
      
      // Debounce progressivo baseado no número de erros
      const debounceTime = Math.min(15000, 3000 * consecutiveErrors.current); // Max 15s
      
      if (now - lastErrorTime.current > debounceTime) {
        errorShownRef.current = true;
        
        // Mensagem de erro contextual
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
        
        // Reset time baseado no número de erros
        const resetTime = Math.min(120000, 30000 * Math.max(1, consecutiveErrors.current - 2)); // Max 2 min
        setTimeout(() => {
          errorShownRef.current = false;
        }, resetTime);
      }
    }
  }, [query.error]);

  return query;
}

export function useMLAuthStart() {
  return useMutation({
    mutationFn: async (): Promise<{ auth_url: string; state: string }> => {
      console.log('Starting ML Auth with PKCE...');
      
      const { data, error } = await supabase.functions.invoke('ml-auth', {
        body: { action: 'start_auth' }
      });

      if (error) {
        console.error('Start Auth Error:', error);
        throw new Error(error.message || "Falha ao iniciar autenticação com Mercado Livre");
      }

      console.log('Auth URL generated successfully:', data.auth_url);
      return data;
    },
    onSuccess: (data) => {
      console.log('Redirecting to ML OAuth...', data.auth_url);
      // Redirect to ML OAuth
      window.location.href = data.auth_url;
    },
    onError: (error: Error) => {
      console.error('ML Auth Start Failed:', error);
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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (code: string): Promise<void> => {
      // Get current URL parameters to extract state
      const urlParams = new URLSearchParams(window.location.search);
      const state = urlParams.get('state');

      console.log('Processing ML callback...', { code: code.substring(0, 10) + '...', state });

      if (!state) {
        throw new Error('Estado de autenticação não encontrado. Tente o processo novamente.');
      }

      const { error } = await supabase.functions.invoke('ml-auth', {
        body: { action: 'handle_callback', code, state }
      });

      if (error) {
        console.error('Callback Error:', error);
        
        // Mensagens de erro mais específicas
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

      console.log('ML Callback processed successfully');
    },
    retry: 0, // Nunca tentar novamente automaticamente
    onSuccess: () => {
      console.log('Invalidating ML auth queries...');
      queryClient.invalidateQueries({ queryKey: [ML_AUTH_QUERY_KEY] });
      
      toast({
        title: "Conexão Realizada!",
        description: "Sua conta do Mercado Livre foi conectada com sucesso.",
      });
    },
    onError: (error: Error) => {
      console.error('ML Callback Failed:', error);
      
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
      console.log('Refreshing ML auth token...');
      
      const { error } = await supabase.functions.invoke('ml-auth', {
        body: { action: 'refresh_token' }
      });

      if (error) {
        console.error('Token Refresh Error:', error);
        
        // Mensagens específicas para refresh
        if (error.message.includes('not found')) {
          throw new Error('Token não encontrado. Faça uma nova conexão.');
        }
        if (error.message.includes('refresh_token')) {
          throw new Error('Token de renovação inválido. Reconecte sua conta.');
        }
        
        throw new Error(error.message || 'Falha na renovação do token');
      }

      console.log('Token refreshed successfully');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ML_AUTH_QUERY_KEY] });
      toast({
        title: "Token Renovado",
        description: "Acesso ao Mercado Livre renovado com sucesso!",
      });
    },
    onError: (error: Error) => {
      console.error('ML Token Refresh Failed:', error);
      
      toast({
        title: "Erro na Renovação",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}