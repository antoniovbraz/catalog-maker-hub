import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ML_QUERY_KEYS } from "./useMLIntegration";
import { useAuth } from '@/contexts/AuthContext';

export function useMLAuthDisconnect() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id;

  return useMutation({
    mutationFn: async (): Promise<void> => {
      console.log('Disconnecting ML auth...');
      
      const { error } = await supabase.functions.invoke('ml-auth', {
        body: { action: 'disconnect' }
      });

      if (error) {
        console.error('Disconnect Error:', error);
        throw new Error(error.message || 'Falha ao desconectar do Mercado Livre');
      }

      console.log('ML disconnected successfully');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ML_QUERY_KEYS.auth(tenantId) });
      toast({
        title: "Desconectado",
        description: "Sua conta do Mercado Livre foi desconectada com sucesso.",
      });
    },
    onError: (error: Error) => {
      console.error('ML Disconnect Failed:', error);
      
      toast({
        title: "Erro na Desconexão",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}