import { Percent, Plus } from '@/components/ui/icons';
import { ConfigurationPageLayout } from "@/components/layout/ConfigurationPageLayout";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { CommissionFormEnhanced } from "@/components/forms/enhanced/CommissionFormEnhanced";
import { useCommissionsWithDetails, useDeleteCommission } from "@/hooks/useCommissions";
import { CommissionWithDetails } from "@/types/commissions";
import { formatarPercentual } from "@/utils/pricing";
import { useState } from "react";
import { useFormVisibility } from "@/hooks/useFormVisibility";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { CardListItem } from "@/components/ui";

const Commissions = () => {
  const { data: commissions = [], isLoading } = useCommissionsWithDetails();
  const deleteMutation = useDeleteCommission();
  const [editingCommission, setEditingCommission] = useState<CommissionWithDetails | null>(null);
  
  const { isFormVisible, isListVisible, showForm, hideForm, toggleList } = useFormVisibility({
    formStorageKey: 'commissions-form-visible',
    listStorageKey: 'commissions-list-visible'
  });

  const totalCommissions = commissions.length;
  const activeCommissions = commissions.filter(c => c.rate > 0).length;


  const breadcrumbs = [
    { label: "Configurações", href: "/dashboard" },
    { label: "Comissões" }
  ];

  const headerActions = (
    <div className="flex items-center gap-2">
      <Button size="sm" onClick={showForm}>
        <Plus className="mr-2 size-4" />
        Nova Comissão
      </Button>
    </div>
  );

  return (
    <ConfigurationPageLayout
      title="Gerenciar Comissões"
      description={
        "Configure as taxas de comissão por marketplace e categoria. " +
        "Essas taxas são fundamentais para o cálculo preciso dos seus preços de venda."
      }
      icon={<Percent className="size-6" />}
      breadcrumbs={breadcrumbs}
      actions={headerActions}
    >
      {/* Form Column */}
      {isFormVisible && (
        <div className="space-y-lg lg:col-span-5 xl:col-span-5">
          <CommissionFormEnhanced
            editingCommission={editingCommission}
            onCancelEdit={() => {
              setEditingCommission(null);
              hideForm();
            }}
          />

          {/* Quick Stats Card */}
          <div className="rounded-lg border bg-card p-lg">
            <h3 className="mb-4 font-semibold">Estatísticas Rápidas</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{totalCommissions}</div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-success">{activeCommissions}</div>
                <div className="text-sm text-muted-foreground">Ativas</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Commissions List Column */}
      <div
        className={
          isFormVisible
            ? "lg:col-span-7 xl:col-span-7"
            : "lg:col-span-12 xl:col-span-12"
        }
      >
        <CollapsibleCard
          title="Comissões Configuradas"
          icon={<Percent className="size-4" />}
          isOpen={isListVisible}
          onToggle={toggleList}
        >
          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 w-full animate-pulse rounded-md bg-muted" />
              ))}
            </div>
          ) : commissions.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              Nenhuma comissão configurada
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {commissions.map((commission) => {
                const impactLevel = commission.rate * 100;
                let impactColor = "text-success";
                let impactLabel = "Baixo";

                if (impactLevel > 10) {
                  impactColor = "text-warning";
                  impactLabel = "Médio";
                }
                if (impactLevel > 20) {
                  impactColor = "text-destructive";
                  impactLabel = "Alto";
                }

                return (
                  <CardListItem
                    key={commission.id}
                    title={commission.marketplaces?.name}
                    subtitle={commission.categories?.name || 'Padrão'}
                    status={
                      <StatusBadge
                        status={commission.rate > 0 ? "active" : "inactive"}
                        label={commission.rate > 0 ? "Ativa" : "Inativa"}
                      />
                    }
                    onEdit={() => {
                      setEditingCommission(commission);
                      showForm();
                    }}
                    onDelete={() => deleteMutation.mutate(commission.id)}
                  >
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Percent className="size-4 text-muted-foreground" />
                        <span className="font-mono font-medium">
                          {formatarPercentual(commission.rate * 100)}
                        </span>
                      </div>
                      <span className={impactColor}>{impactLabel}</span>
                    </div>
                  </CardListItem>
                );
              })}
            </div>
          )}
        </CollapsibleCard>
      </div>
    </ConfigurationPageLayout>
  );
};

export default Commissions;

