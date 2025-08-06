import { Percent, Plus, Calculator } from '@/components/ui/icons';
import { ConfigurationPageLayout } from "@/components/layout/ConfigurationPageLayout";
import { DataVisualization } from "@/components/ui/data-visualization";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CommissionFormEnhanced } from "@/components/forms/enhanced/CommissionFormEnhanced";
import { useCommissionsWithDetails, useDeleteCommission } from "@/hooks/useCommissions";
import { CommissionWithDetails } from "@/types/commissions";
import { formatarPercentual } from "@/utils/pricing";
import { useState } from "react";
import { useFormVisibility } from "@/hooks/useFormVisibility";
import { CollapsibleCard } from "@/components/ui/collapsible-card";

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

  const columns = [
    {
      key: "marketplace",
      header: "Marketplace",
      sortable: true,
      render: (commission: CommissionWithDetails) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{commission.marketplaces?.name}</span>
        </div>
      )
    },
    {
      key: "category",
      header: "Categoria",
      render: (commission: CommissionWithDetails) => (
        <div className="flex items-center gap-2">
          <span>{commission.categories?.name || 'Padrão'}</span>
          {!commission.categories && (
            <Badge variant="outline" className="text-xs">Geral</Badge>
          )}
        </div>
      )
    },
    {
      key: "rate",
      header: "Taxa de Comissão",
      sortable: true,
      render: (commission: CommissionWithDetails) => (
        <div className="flex items-center gap-2">
          <Percent className="size-4 text-muted-foreground" />
          <span className="font-mono font-medium">
            {formatarPercentual(commission.rate * 100)}
          </span>
        </div>
      )
    },
    {
      key: "status",
      header: "Status",
      render: (commission: CommissionWithDetails) => {
        const isActive = commission.rate > 0;
        return (
          <StatusBadge
            status={isActive ? "active" : "inactive"}
            label={isActive ? "Ativa" : "Inativa"}
          />
        );
      }
    },
    {
      key: "impact",
      header: "Impacto no Preço",
      render: (commission: CommissionWithDetails) => {
        const impactLevel = commission.rate * 100;
        let color = "bg-success/20 text-success";
        let label = "Baixo";

        if (impactLevel > 10) {
          color = "bg-warning/20 text-warning";
          label = "Médio";
        }
        if (impactLevel > 20) {
          color = "bg-destructive/20 text-destructive";
          label = "Alto";
        }

        return (
          <Badge className={color}>
            {label}
          </Badge>
        );
      }
    }
  ];

  const actions = [
    {
      label: "Editar",
      icon: <Calculator className="size-4" />,
      onClick: (commission: CommissionWithDetails) => {
        setEditingCommission(commission);
        showForm();
      },
      variant: "outline" as const
    },
    {
      label: "Excluir",
      icon: <Percent className="size-4" />,
      onClick: (commission: CommissionWithDetails) => deleteMutation.mutate(commission.id),
      variant: "destructive" as const
    }
  ];

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

      {/* Data Visualization Column */}
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
          <DataVisualization
            title=""
            description="Visualize todas as comissões por marketplace e categoria"
            data={commissions}
            columns={columns}
            actions={actions}
            isLoading={isLoading}
            searchable={true}
          />
        </CollapsibleCard>
      </div>
    </ConfigurationPageLayout>
  );
};

export default Commissions;

