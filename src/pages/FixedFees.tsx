import { FixedFeeRuleForm } from "@/components/forms/FixedFeeRuleForm";
import { ConfigurationPageLayout } from "@/components/layout/ConfigurationPageLayout";
import { Coins, Plus } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { useFormVisibility } from "@/hooks/useFormVisibility";
import { BaseCard, CardListItem } from "@/components/ui";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { handleSupabaseError } from "@/utils/errors";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingSpinner, SuccessToast } from "@/components/ui/feedback";
import { useState } from "react";

const FixedFees = () => {
  const { isFormVisible, showForm, hideForm } = useFormVisibility({
    formStorageKey: 'fixed-fees-form-visible',
    listStorageKey: 'fixed-fees-list-visible'
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

  const {
    data: fixedFeeRules = [],
    isLoading,
    isError,
    error,
  } = useQuery({
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
      setSuccessMessage("Taxa fixa excluída com sucesso!");
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
        <Plus className="mr-2 size-4" />
        Nova Taxa
      </Button>
    </div>
  );

  return (
    <ConfigurationPageLayout
      title="Regras de valor fixo"
      description="Configure regras de valor fixo por marketplace com diferentes tipos"
      icon={<Coins className="size-6" />}
      breadcrumbs={breadcrumbs}
      actions={headerActions}
    >
      {isFormVisible && (
        <div className="lg:col-span-6 xl:col-span-6">
          <FixedFeeRuleForm onCancel={hideForm} />
        </div>
      )}

      <div
        className={
          isFormVisible
            ? "lg:col-span-6 xl:col-span-6"
            : "lg:col-span-12 xl:col-span-12"
        }
      >
        <BaseCard
          title={
            <div className="flex items-center gap-2">
              <Coins className="size-5" />
              <span>Taxas Fixas Configuradas</span>
            </div>
          }
        >
          {isLoading ? (
            <div className="py-12">
              <LoadingSpinner />
            </div>
          ) : isError ? (
            <div className="p-4 text-center text-destructive">
              Erro ao carregar taxas fixas: {" "}
              {error instanceof Error ? error.message : "Erro desconhecido"}
            </div>
          ) : fixedFeeRules.length === 0 ? (
            <EmptyState
              icon={<Coins className="size-8" />}
              title="Nenhuma taxa fixa configurada"
              description="Adicione uma nova taxa para começar"
              action={{
                label: "Nova Taxa",
                onClick: showForm,
                icon: <Plus className="mr-2 size-4" />,
              }}
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {fixedFeeRules.map((rule) => {
                const rangeText =
                  (rule.rule_type === "faixa" || rule.rule_type === "percentual") &&
                  rule.range_min !== null &&
                  rule.range_max !== null
                    ? `R$ ${rule.range_min.toFixed(2)} - R$ ${rule.range_max.toFixed(2)}`
                    : rule.rule_type === "constante"
                    ? "Todas as faixas"
                    : undefined

                return (
                  <CardListItem
                    key={rule.id}
                    title={rule.marketplaces?.name}
                    subtitle={RULE_TYPES.find((t) => t.value === rule.rule_type)?.label}
                    status={
                      rule.rule_type === "percentual"
                        ? `${rule.value.toFixed(2)}%`
                        : `R$ ${rule.value.toFixed(2)}`
                    }
                    onDelete={() => deleteMutation.mutate(rule.id)}
                  >
                    {rangeText && (
                      <span className="text-sm text-muted-foreground">{rangeText}</span>
                    )}
                  </CardListItem>
                );
              })}
            </div>
          )}
        </BaseCard>
        {successMessage && (
          <SuccessToast
            message={successMessage}
            onClose={() => setSuccessMessage(null)}
          />
        )}
      </div>
    </ConfigurationPageLayout>
  );
};

export default FixedFees;

