import { Calculator, Plus } from "lucide-react";
import { ConfigurationPageLayout } from "@/components/layout/ConfigurationPageLayout";
import { DataVisualization } from "@/components/ui/data-visualization";
import { StatusBadge } from "@/components/ui/status-badge";
import { FixedFeeRuleFormEnhanced } from "@/components/forms/enhanced/FixedFeeRuleFormEnhanced";
import { useState } from "react";

const FixedFees = () => {
  // Mock data for now - replace with actual hook
  const fixedFees: any[] = [];
  const isLoading = false;
  const [editingFee, setEditingFee] = useState(null);

  const columns = [
    { key: "marketplace", header: "Marketplace" },
    { key: "rule_type", header: "Tipo" },
    { key: "value", header: "Valor" }
  ];

  const actions = [
    {
      label: "Editar",
      icon: <Calculator className="w-4 h-4" />,
      onClick: (fee: any) => setEditingFee(fee),
      variant: "outline" as const
    }
  ];

  return (
    <ConfigurationPageLayout
      title="Regras de Valor Fixo"
      description="Configure regras de valor fixo por marketplace com diferentes tipos"
      icon={<Calculator className="w-6 h-6" />}
    >
      <div className="xl:col-span-5">
        <FixedFeeRuleFormEnhanced
          editingFee={editingFee}
          onCancelEdit={() => setEditingFee(null)}
        />
      </div>
      <div className="xl:col-span-7">
        <DataVisualization
          title="Regras Configuradas"
          data={fixedFees}
          columns={columns}
          actions={actions}
          isLoading={isLoading}
        />
      </div>
    </ConfigurationPageLayout>
  );
};

export default FixedFees;