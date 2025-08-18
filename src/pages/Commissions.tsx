import { Percent, Plus, Calculator } from '@/components/ui/icons';
import { ConfigurationPageLayout } from "@/components/layout/ConfigurationPageLayout";
import { DataVisualization } from "@/components/ui/data-visualization";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCommissionsWithDetails, useDeleteCommission } from "@/hooks/useCommissions";
import { CommissionWithDetails } from "@/types/commissions";
import { formatarPercentual } from "@/utils/pricing";
import { useGlobalModal } from "@/hooks/useGlobalModal";
import { CommissionModalForm } from "@/components/forms/CommissionModalForm";

const Commissions = () => {
  const { data: commissions = [], isLoading } = useCommissionsWithDetails();
  const deleteMutation = useDeleteCommission();
  const { showFormModal, showConfirmModal } = useGlobalModal();

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

  const handleCreate = () => {
    let submitForm: (() => Promise<void>) | null = null;

    showFormModal({
      title: "Nova Comissão",
      description:
        "Configure uma nova taxa de comissão para cálculo de preços",
      content: (
        <CommissionModalForm
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

  const handleEdit = (commission: CommissionWithDetails) => {
    let submitForm: (() => Promise<void>) | null = null;

    showFormModal({
      title: "Editar Comissão",
      description: "Atualize a taxa de comissão",
      content: (
        <CommissionModalForm
          commission={commission}
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

  const handleDelete = (commission: CommissionWithDetails) => {
    showConfirmModal({
      title: "Excluir Comissão",
      description: `Tem certeza que deseja excluir a comissão do ${commission.marketplaces?.name}${commission.categories ? ` - ${commission.categories.name}` : " (Padrão)"}? Esta ação não pode ser desfeita.`,
      onConfirm: async () => {
        await deleteMutation.mutateAsync(commission.id);
      },
      confirmText: "Excluir",
      variant: "destructive",
    });
  };

  const actions = [
    {
      label: "Editar",
      icon: <Calculator className="size-4" />,
      onClick: (commission: CommissionWithDetails) => handleEdit(commission),
      variant: "outline" as const,
    },
    {
      label: "Excluir",
      icon: <Percent className="size-4" />,
      onClick: (commission: CommissionWithDetails) => handleDelete(commission),
      variant: "destructive" as const,
    },
  ];

  const breadcrumbs = [
    { label: "Configurações", href: "/dashboard" },
    { label: "Comissões" }
  ];

  const headerActions = (
    <div className="flex items-center gap-2">
      <Button size="sm" onClick={handleCreate}>
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
      <div className="space-y-6 xl:col-span-12">
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

export default Commissions;

