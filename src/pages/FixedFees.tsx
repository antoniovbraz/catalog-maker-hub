import { FixedFeeRuleForm } from "@/components/forms/FixedFeeRuleForm";
import { ConfigurationPageLayout } from "@/components/layout/ConfigurationPageLayout";
import { Coins, Plus, Edit, Trash2, Info } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { useFormVisibility } from "@/hooks/useFormVisibility";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { handleSupabaseError } from "@/utils/errors";
import { useState } from "react";

const FixedFees = () => {
  const { isFormVisible, showForm, hideForm } = useFormVisibility({
    formStorageKey: 'fixed-fees-form-visible',
    listStorageKey: 'fixed-fees-list-visible'
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  interface FixedFeeRule {
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

  const RULE_TYPES = [
    { 
      value: "constante", 
      label: "Constante",
      description: "Valor fixo aplicado independente do preço do produto"
    },
    { 
      value: "faixa", 
      label: "Faixa",
      description: "Valor aplicado quando o preço estiver dentro de uma faixa específica"
    },
    { 
      value: "percentual", 
      label: "Percentual",
      description: "Percentual aplicado sobre o valor do produto dentro de uma faixa específica"
    }
  ];

  const { data: fixedFeeRules = [], isLoading } = useQuery({
    queryKey: ["marketplace_fixed_fee_rules"],
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
    }
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
      const friendlyMessage = handleSupabaseError(error);
      toast({ 
        title: "Erro ao excluir taxa fixa", 
        description: friendlyMessage, 
        variant: "destructive" 
      });
    }
  });

  const breadcrumbs = [
    { label: "Configurações", href: "/dashboard" },
    { label: "Regras de valor fixo" }
  ];

  const headerActions = (
    <div className="flex items-center gap-2">
      <Button size="sm" onClick={showForm}>
        <Plus className="w-4 h-4 mr-2" />
        Nova Taxa
      </Button>
    </div>
  );

  return (
    <ConfigurationPageLayout
      title="Regras de valor fixo"
      description="Configure regras de valor fixo por marketplace com diferentes tipos"
      icon={<Coins className="w-6 h-6" />}
      breadcrumbs={breadcrumbs}
      actions={headerActions}
    >
      {isFormVisible && (
        <div className="xl:col-span-6">
          <FixedFeeRuleForm onCancel={hideForm} />
        </div>
      )}

      <div className={isFormVisible ? "xl:col-span-6" : "xl:col-span-12"}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="w-5 h-5" />
              Taxas Fixas Configuradas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>Carregando...</p>
            ) : fixedFeeRules.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                <p>Nenhuma taxa fixa configurada</p>
                <p className="text-sm mt-1">Adicione uma nova taxa para começar</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Marketplace</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Faixa</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fixedFeeRules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell className="font-medium">{rule.marketplaces?.name}</TableCell>
                      <TableCell>
                        {RULE_TYPES.find(t => t.value === rule.rule_type)?.label}
                      </TableCell>
                      <TableCell>
                         {(rule.rule_type === "faixa" || rule.rule_type === "percentual") && rule.range_min !== null && rule.range_max !== null
                           ? `R$ ${rule.range_min.toFixed(2)} - R$ ${rule.range_max.toFixed(2)}`
                           : rule.rule_type === "constante" ? "Todas as faixas" : "-"
                         }
                       </TableCell>
                       <TableCell>
                         {rule.rule_type === "percentual"
                          ? `${rule.value.toFixed(2)}%`
                          : `R$ ${rule.value.toFixed(2)}`
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteMutation.mutate(rule.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
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
      </div>
    </ConfigurationPageLayout>
  );
};

export default FixedFees;