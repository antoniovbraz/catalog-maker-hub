import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  mlAdvancedSettingsSchema,
  type MLAdvancedSettings,
} from "@/types/ml/advanced-settings";

export function useMLAdvancedSettings() {
  return useQuery({
    queryKey: ["ml-advanced-settings"],
    queryFn: async (): Promise<MLAdvancedSettings> => {
      const { data, error } = await supabase.rpc("get_ml_advanced_settings");

      if (error) {
        console.error("Error fetching ML advanced settings:", error);
        throw new Error(error.message);
      }

      return mlAdvancedSettingsSchema.parse(data);
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });
}

export function useUpdateMLAdvancedSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      settings: Partial<MLAdvancedSettings>
    ): Promise<MLAdvancedSettings> => {
      const { data, error } = await supabase.rpc("update_ml_advanced_settings", {
        p_settings: settings,
      });

      if (error) {
        console.error("Error updating ML advanced settings:", error);
        throw new Error(error.message || "Falha ao atualizar configurações");
      }

      return mlAdvancedSettingsSchema.parse(data);
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