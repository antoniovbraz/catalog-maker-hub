import { Trash2, Truck } from "@/components/ui/icons";
import { DataVisualization } from "@/components/ui/data-visualization";
import { useShippingRules, SHIPPING_RULES_QUERY_KEY } from "@/hooks/useShippingRules";
import { shippingRulesService } from "@/services/shipping-rules";
import { ShippingRuleType } from "@/types/shipping";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/use-toast";
import { formatarMoeda } from "@/utils/pricing";

export function ShippingRulesTable() {
  const { data: shippingRules = [], isLoading } = useShippingRules();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const deleteMutation = useMutation({
    mutationFn: (id: string) => shippingRulesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SHIPPING_RULES_QUERY_KEY });
      toast({ title: "Regra de frete excluída" });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir regra de frete",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const columns = [
    {
      key: "products.name",
      header: "Produto",
      render: (item: ShippingRuleType) => (
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">{item.products?.name}</span>
        </div>
      ),
    },
    {
      key: "marketplaces.name",
      header: "Marketplace",
      render: (item: ShippingRuleType) => item.marketplaces?.name,
    },
    {
      key: "shipping_cost",
      header: "Custo Frete",
      render: (item: ShippingRuleType) => formatarMoeda(item.shipping_cost),
    },
    {
      key: "free_shipping_threshold",
      header: "Frete Grátis",
      render: (item: ShippingRuleType) =>
        item.free_shipping_threshold
          ? `A partir de ${formatarMoeda(item.free_shipping_threshold)}`
          : "Não disponível",
      className: "break-words",
    },
  ];

  const actions = [
    {
      label: "Excluir",
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (rule: ShippingRuleType) => deleteMutation.mutate(rule.id),
      variant: "destructive" as const,
      disabled: () => deleteMutation.isPending,
    },
  ];

  return (
    <DataVisualization
      title=""
      data={shippingRules}
      columns={columns}
      actions={actions}
      isLoading={isLoading}
      emptyState={
        <div className="text-center py-8">
          <p className="text-muted-foreground">Nenhuma regra de frete configurada</p>
          <p className="text-sm text-muted-foreground">Adicione uma nova regra para começar</p>
        </div>
      }
    />
  );
}
