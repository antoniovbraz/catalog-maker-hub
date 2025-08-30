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
  
  const query = useQuery({
    queryKey: [ML_AUTH_QUERY_KEY],
    queryFn: async (): Promise<MLAuthStatus> => {
      const { data, error } = await supabase.functions.invoke('ml-auth', {
        body: { action: 'get_status' }
      });

      if (error) throw error;
      return data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes - aumentar staleTime
    retry: false, // Desabilitar retry automático
    refetchOnWindowFocus: false, // Não revalidar no foco
    refetchOnMount: false, // Não revalidar no mount se já tem dados
  });

  // Handle errors with useEffect to prevent render loops
  useEffect(() => {
    if (query.error && !errorShownRef.current) {
      errorShownRef.current = true;
      toast({
        title: "Erro na verificação ML",
        description: query.error.message,
        variant: "destructive",
      });
      
      // Reset after some time to allow new errors
      setTimeout(() => {
        errorShownRef.current = false;
      }, 30000);
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