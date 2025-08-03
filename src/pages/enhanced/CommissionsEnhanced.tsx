import { Percent, Plus, Upload, Download, Calculator } from '@/components/ui/icons';
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

const CommissionsEnhanced = () => {
  const { data: commissions = [], isLoading } = useCommissionsWithDetails();
  const deleteMutation = useDeleteCommission();
  const [editingCommission, setEditingCommission] = useState<CommissionWithDetails | null>(null);

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
          <Percent className="w-4 h-4 text-muted-foreground" />
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
      icon: <Calculator className="w-4 h-4" />,
      onClick: (commission: CommissionWithDetails) => setEditingCommission(commission),
      variant: "outline" as const
    },
    {
      label: "Excluir",
      icon: <Percent className="w-4 h-4" />,
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
      <Button variant="outline" size="sm">
        <Upload className="w-4 h-4 mr-2" />
        Importar
      </Button>
      <Button variant="outline" size="sm">
        <Download className="w-4 h-4 mr-2" />
        Exportar
      </Button>
      <Button size="sm">
        <Plus className="w-4 h-4 mr-2" />
        Nova Comissão
      </Button>
    </div>
  );

  return (
    <ConfigurationPageLayout
      title="Gerenciar Comissões"
      description="Configure as taxas de comissão por marketplace e categoria. Essas taxas são fundamentais para o cálculo preciso dos seus preços de venda."
      icon={<Percent className="w-6 h-6" />}
      breadcrumbs={breadcrumbs}
      actions={headerActions}
      progressValue={activeCommissions}
      progressTotal={totalCommissions}
    >
      {/* Form Column */}
      <div className="xl:col-span-5 space-y-lg">
        <CommissionFormEnhanced
          editingCommission={editingCommission}
          onCancelEdit={() => setEditingCommission(null)}
        />
        
        {/* Quick Stats Card */}
        <div className="bg-card rounded-lg p-lg border">
          <h3 className="font-semibold mb-4">Estatísticas Rápidas</h3>
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

      {/* Data Visualization Column */}
      <div className="xl:col-span-7">
        <DataVisualization
          title="Comissões Configuradas"
          description="Visualize todas as comissões por marketplace e categoria"
          data={commissions}
          columns={columns}
          actions={actions}
          isLoading={isLoading}
          searchable={true}
        />
      </div>
    </ConfigurationPageLayout>
  );
};

export default CommissionsEnhanced;