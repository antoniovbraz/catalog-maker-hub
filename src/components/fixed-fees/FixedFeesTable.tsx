import { Edit, Trash2, Coins } from "@/components/ui/icons";
import { DataVisualization } from "@/components/ui/data-visualization";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { FixedFeeRule } from "@/types/fixed-fees";
import { formatarMoeda } from "@/utils/pricing";

interface FixedFeesTableProps {
  onEdit: (rule: FixedFeeRule) => void;
}

const RULE_TYPES: Record<string, string> = {
  constante: "Constante",
  faixa: "Faixa",
  percentual: "Percentual",
};

export const FixedFeesTable = ({ onEdit }: FixedFeesTableProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: fixedFeeRules = [], isLoading } = useQuery<FixedFeeRule[]>({
    queryKey: ["marketplace_fixed_fee_rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketplace_fixed_fee_rules")
        .select(`*, marketplaces (name)`).order("created_at", { ascending: false });
      if (error) throw error;
      return data as FixedFeeRule[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("marketplace_fixed_fee_rules")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["marketplace_fixed_fee_rules"] });
      toast({ title: "Taxa fixa excluída com sucesso!" });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir taxa fixa",
        description: String(error),
        variant: "destructive",
      });
    },
  });

  const columns = [
    {
      key: "marketplaces.name",
      header: "Marketplace",
      render: (item: FixedFeeRule) => (
        <div className="flex items-center gap-2">
          <Coins className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">{item.marketplaces?.name}</span>
        </div>
      ),
    },
    {
      key: "rule_type",
      header: "Tipo",
      render: (item: FixedFeeRule) => RULE_TYPES[item.rule_type] || item.rule_type,
      className: "break-words",
    },
    {
      key: "range_min",
      header: "Faixa",
      render: (item: FixedFeeRule) => {
        if ((item.rule_type === "faixa" || item.rule_type === "percentual") &&
            item.range_min !== null && item.range_max !== null) {
          return `${formatarMoeda(item.range_min)} - ${formatarMoeda(item.range_max)}`;
        }
        return item.rule_type === "constante" ? "Todas as faixas" : "-";
      },
    },
    {
      key: "value",
      header: "Valor",
      render: (item: FixedFeeRule) =>
        item.rule_type === "percentual"
          ? `${item.value.toFixed(2)}%`
          : formatarMoeda(item.value),
    },
  ];

  const actions = [
    {
      label: "Editar",
      icon: <Edit className="w-4 h-4" />,
      onClick: (rule: FixedFeeRule) => onEdit(rule),
    },
    {
      label: "Excluir",
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (rule: FixedFeeRule) => deleteMutation.mutate(rule.id),
      variant: "destructive" as const,
      disabled: () => deleteMutation.isPending,
    },
  ];

  return (
    <DataVisualization
      title=""
      data={fixedFeeRules}
      columns={columns}
      actions={actions}
      isLoading={isLoading}
      emptyState={
        <div className="text-center py-8">
          <p className="text-muted-foreground">Nenhuma taxa fixa configurada</p>
          <p className="text-sm text-muted-foreground">
            Adicione uma nova taxa para começar
          </p>
        </div>
      }
    />
  );
};

