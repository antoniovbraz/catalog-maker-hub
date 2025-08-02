import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { handleSupabaseError } from "@/utils/errors";

export interface FixedFeeRule {
  id: string;
  marketplace_id: string;
  rule_type: string;
  range_min: number | null;
  range_max: number | null;
  value: number;
  created_at: string;
  updated_at: string;
  marketplaces?: {
    name: string;
  };
}

export interface FixedFeeRuleFormData {
  marketplace_id: string;
  rule_type: string;
  range_min: string;
  range_max: string;
  value: string;
}

export const FIXED_FEES_QUERY_KEY = "marketplace_fixed_fee_rules";

export function useFixedFees() {
  return useQuery({
    queryKey: [FIXED_FEES_QUERY_KEY],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketplace_fixed_fee_rules")
        .select(`
          *,
          marketplaces (name)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as FixedFeeRule[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateFixedFee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: FixedFeeRuleFormData) => {
      const { error } = await supabase
        .from("marketplace_fixed_fee_rules")
        .insert([{
          marketplace_id: data.marketplace_id,
          rule_type: data.rule_type,
          range_min: data.range_min ? parseFloat(data.range_min) : null,
          range_max: data.range_max ? parseFloat(data.range_max) : null,
          value: parseFloat(data.value)
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FIXED_FEES_QUERY_KEY] });
      toast({ 
        title: "Sucesso", 
        description: "Taxa fixa criada com sucesso!" 
      });
    },
    onError: (error) => {
      const friendlyMessage = handleSupabaseError(error);
      toast({ 
        title: "Erro ao criar taxa fixa", 
        description: friendlyMessage, 
        variant: "destructive" 
      });
    }
  });
}

export function useUpdateFixedFee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: FixedFeeRuleFormData }) => {
      const { error } = await supabase
        .from("marketplace_fixed_fee_rules")
        .update({
          marketplace_id: data.marketplace_id,
          rule_type: data.rule_type,
          range_min: data.range_min ? parseFloat(data.range_min) : null,
          range_max: data.range_max ? parseFloat(data.range_max) : null,
          value: parseFloat(data.value)
        })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FIXED_FEES_QUERY_KEY] });
      toast({ 
        title: "Sucesso", 
        description: "Taxa fixa atualizada com sucesso!" 
      });
    },
    onError: (error) => {
      const friendlyMessage = handleSupabaseError(error);
      toast({ 
        title: "Erro ao atualizar taxa fixa", 
        description: friendlyMessage, 
        variant: "destructive" 
      });
    }
  });
}

export function useDeleteFixedFee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("marketplace_fixed_fee_rules")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FIXED_FEES_QUERY_KEY] });
      toast({ 
        title: "Sucesso", 
        description: "Taxa fixa deletada com sucesso!" 
      });
    },
    onError: (error) => {
      const friendlyMessage = handleSupabaseError(error);
      toast({ 
        title: "Erro ao deletar taxa fixa", 
        description: friendlyMessage, 
        variant: "destructive" 
      });
    }
  });
}