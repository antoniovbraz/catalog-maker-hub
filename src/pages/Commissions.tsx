import { Percent, Plus, Calculator } from "lucide-react";
import { ConfigurationPageLayout } from "@/components/layout/ConfigurationPageLayout";
import { DataVisualization } from "@/components/ui/data-visualization";
import { StatusBadge } from "@/components/ui/status-badge";
import { CommissionFormEnhanced } from "@/components/forms/enhanced/CommissionFormEnhanced";
import { useCommissionsWithDetails, useDeleteCommission } from "@/hooks/useCommissions";
import { CommissionWithDetails } from "@/types/commissions";
import { formatarPercentual } from "@/utils/pricing";
import { useState } from "react";

const Commissions = () => {
  const { data: commissions = [], isLoading } = useCommissionsWithDetails();
  const deleteMutation = useDeleteCommission();
  const [editingCommission, setEditingCommission] = useState<CommissionWithDetails | null>(null);

  const columns = [
    {
      key: "marketplace",
      header: "Marketplace", 
      render: (commission: CommissionWithDetails) => commission.marketplaces?.name
    },
    {
      key: "category",
      header: "Categoria",
      render: (commission: CommissionWithDetails) => commission.categories?.name || 'Padrão'
    },
    {
      key: "rate",
      header: "Taxa",
      render: (commission: CommissionWithDetails) => formatarPercentual(commission.rate * 100)
    }
  ];

  const actions = [
    {
      label: "Editar",
      icon: <Calculator className="w-4 h-4" />,
      onClick: (commission: CommissionWithDetails) => setEditingCommission(commission),
      variant: "outline" as const
    }
  ];

  return (
    <ConfigurationPageLayout
      title="Comissões"
      description="Configure comissões por marketplace e categoria"
      icon={<Percent className="w-6 h-6" />}
    >
      <div className="xl:col-span-5">
        <CommissionFormEnhanced
          editingCommission={editingCommission}
          onCancelEdit={() => setEditingCommission(null)}
        />
      </div>
      <div className="xl:col-span-7">
        <DataVisualization
          title="Comissões Configuradas"
          data={commissions}
          columns={columns}
          actions={actions}
          isLoading={isLoading}
        />
      </div>
    </ConfigurationPageLayout>
  );
};

export default Commissions;