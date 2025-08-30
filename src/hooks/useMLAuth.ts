import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  return useQuery({
    queryKey: [ML_AUTH_QUERY_KEY],
    queryFn: async (): Promise<MLAuthStatus> => {
      const { data, error } = await supabase.functions.invoke('ml-auth', {
        body: { action: 'get_status' }
      });

      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 0,
    onError: (error: Error) => {
      toast({
        title: "Erro na verificação",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useMLAuthStart() {
  return useMutation({
    mutationFn: async (): Promise<{ auth_url: string; state: string }> => {
      const response = await fetch("/api/ml/start", { method: "POST" });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || data?.message || "Failed to start auth");
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

      const response = await fetch('/api/ml/callback', {
        method: 'POST',
        body: JSON.stringify({ code, state }),
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || data?.message || 'Failed to handle callback');
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