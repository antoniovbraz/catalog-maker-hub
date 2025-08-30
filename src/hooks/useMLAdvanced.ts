import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface MLPerformanceMetrics {
  total_operations: number;
  successful_operations: number;
  failed_operations: number;
  average_response_time: number;
  success_rate: number;
  operations_by_type: Record<string, number>;
}

export function useMLPerformanceMetrics(days: number = 7) {
  return useQuery({
    queryKey: ["ml-performance-metrics", days],
    queryFn: async (): Promise<MLPerformanceMetrics> => {
      const { data, error } = await supabase.rpc("get_ml_performance_metrics", {
        p_days: days,
      });

      if (error) {
        console.error("Error fetching ML performance metrics:", error);
        throw new Error(error.message);
      }

      return data || {
        total_operations: 0,
        successful_operations: 0,
        failed_operations: 0,
        average_response_time: 0,
        success_rate: 0,
        operations_by_type: {},
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });
}

export function useMLBackup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<any> => {
      const { data, error } = await supabase.rpc("backup_ml_configuration");

      if (error) {
        console.error("Error creating ML backup:", error);
        throw new Error(error.message || "Falha ao criar backup");
      }

      return data;
    },
    onSuccess: () => {
      toast({
        title: "Backup Criado",
        description: "Configurações ML foram salvas com sucesso.",
      });
    },
    onError: (error: Error) => {
      console.error("ML Backup Failed:", error);
      toast({
        title: "Erro no Backup",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useMLRateLimit() {
  return useMutation({
    mutationFn: async (operationType: string): Promise<boolean> => {
      const { data, error } = await supabase.rpc("check_ml_rate_limit", {
        p_operation_type: operationType,
      });

      if (error) {
        console.error("Error checking rate limit:", error);
        throw new Error(error.message);
      }

      return data;
    },
    onError: (error: Error) => {
      console.error("Rate limit check failed:", error);
      toast({
        title: "Limite de Taxa",
        description: "Muitas operações. Aguarde antes de tentar novamente.",
        variant: "destructive",
      });
    },
  });
}