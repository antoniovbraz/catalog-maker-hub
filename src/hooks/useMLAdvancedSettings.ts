import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface MLAdvancedSettings {
  id: string;
  tenant_id: string;
  feature_flags: Record<string, any>;
  rate_limits: {
    sync_product: number;
    sync_order: number;
    token_refresh: number;
    default: number;
  };
  backup_schedule: string;
  auto_recovery_enabled: boolean;
  advanced_monitoring: boolean;
  multi_account_enabled: boolean;
  security_level: string;
  created_at: string;
  updated_at: string;
}

export function useMLAdvancedSettings() {
  return useQuery({
    queryKey: ["ml-advanced-settings"],
    queryFn: async (): Promise<MLAdvancedSettings> => {
      const { data, error } = await supabase.rpc("get_ml_advanced_settings");

      if (error) {
        console.error("Error fetching ML advanced settings:", error);
        throw new Error(error.message);
      }

      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });
}

export function useUpdateMLAdvancedSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Partial<MLAdvancedSettings>): Promise<MLAdvancedSettings> => {
      const { data, error } = await supabase.rpc("update_ml_advanced_settings", {
        p_settings: settings,
      });

      if (error) {
        console.error("Error updating ML advanced settings:", error);
        throw new Error(error.message || "Falha ao atualizar configurações");
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ml-advanced-settings"] });
      toast({
        title: "Configurações Atualizadas",
        description: "Configurações avançadas foram salvas com sucesso.",
      });
    },
    onError: (error: Error) => {
      console.error("ML Advanced Settings Update Failed:", error);
      toast({
        title: "Erro na Atualização",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}