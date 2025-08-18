import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Edit, Trash2 } from "@/components/ui/icons";
import { handleSupabaseError } from "@/utils/errors";
import { useGlobalModal } from "@/hooks/useGlobalModal";
import { ShippingRuleModalForm } from "./ShippingRuleModalForm";

interface ShippingRule {
  id: string;
  product_id: string;
  marketplace_id: string;
  shipping_cost: number;
  free_shipping_threshold: number;
  products?: { name: string };
  marketplaces?: { name: string };
}

export const ShippingRuleForm = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { showFormModal, showConfirmModal } = useGlobalModal();

  const { data: shippingRules = [], isLoading } = useQuery({
    queryKey: ["shipping_rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shipping_rules")
        .select(
          `*, products(name), marketplaces(name)`
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ShippingRule[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("shipping_rules")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipping_rules"] });
      toast({ title: "Regra de frete excluída com sucesso!" });
    },
    onError: (error) => {
      const friendlyMessage = handleSupabaseError(error);
      toast({
        title: "Erro ao excluir regra de frete",
        description: friendlyMessage,
        variant: "destructive",
      });
    },
  });

  const handleEdit = (rule: ShippingRule) => {
    let submitForm: (() => Promise<void>) | null = null;

    showFormModal({
      title: "Editar Regra de Frete",
      content: (
        <ShippingRuleModalForm
          rule={rule}
          onSuccess={() => {}}
          onSubmitForm={(fn) => {
            submitForm = fn;
          }}
        />
      ),
      onSave: async () => {
        if (submitForm) await submitForm();
      },
      size: "md",
    });
  };

  const handleDelete = (rule: ShippingRule) => {
    showConfirmModal({
      title: "Excluir Regra de Frete",
      description:
        "Tem certeza que deseja excluir esta regra de frete? Esta ação não pode ser desfeita.",
      onConfirm: async () => {
        await deleteMutation.mutateAsync(rule.id);
      },
      confirmText: "Excluir",
      variant: "destructive",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Regras de Frete Cadastradas</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p>Carregando...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Marketplace</TableHead>
                <TableHead>Custo Frete</TableHead>
                <TableHead>Frete Grátis</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shippingRules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="font-medium">
                    {rule.products?.name}
                  </TableCell>
                  <TableCell>{rule.marketplaces?.name}</TableCell>
                  <TableCell>R$ {rule.shipping_cost.toFixed(2)}</TableCell>
                  <TableCell>
                    {rule.free_shipping_threshold > 0
                      ? `A partir de R$ ${rule.free_shipping_threshold.toFixed(2)}`
                      : "Não disponível"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(rule)}
                      >
                        <Edit className="size-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(rule)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default ShippingRuleForm;

