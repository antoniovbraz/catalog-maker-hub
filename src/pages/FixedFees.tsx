import { Calculator, Edit, Trash2 } from "lucide-react";
import { ConfigurationPageLayout } from "@/components/layout/ConfigurationPageLayout";
import { DataVisualization } from "@/components/ui/data-visualization";
import { StatusBadge } from "@/components/ui/status-badge";
import { FixedFeeRuleFormEnhanced } from "@/components/forms/enhanced/FixedFeeRuleFormEnhanced";
import { useFixedFees, useDeleteFixedFee, FixedFeeRule } from "@/hooks/useFixedFees";
import { useState } from "react";

const RULE_TYPES = [
  { value: "constante", label: "Constante" },
  { value: "faixa", label: "Faixa" },
  { value: "percentual", label: "Percentual" }
];

const FixedFees = () => {
  const { data: fixedFees = [], isLoading } = useFixedFees();
  const deleteMutation = useDeleteFixedFee();
  const [editingFee, setEditingFee] = useState<FixedFeeRule | null>(null);

  const columns = [
    { 
      key: "marketplaces.name", 
      header: "Marketplace",
      render: (rule: FixedFeeRule) => rule.marketplaces?.name || "-"
    },
    { 
      key: "rule_type", 
      header: "Tipo",
      render: (rule: FixedFeeRule) => {
        const ruleType = RULE_TYPES.find(t => t.value === rule.rule_type);
        return <StatusBadge status="active" label={ruleType?.label || rule.rule_type} size="sm" />;
      }
    },
    { 
      key: "range", 
      header: "Faixa",
      render: (rule: FixedFeeRule) => {
        if ((rule.rule_type === "faixa" || rule.rule_type === "percentual") && 
            rule.range_min !== null && rule.range_max !== null) {
          return `R$ ${rule.range_min.toFixed(2)} - R$ ${rule.range_max.toFixed(2)}`;
        }
        return rule.rule_type === "constante" ? "Todas as faixas" : "-";
      }
    },
    { 
      key: "value", 
      header: "Valor",
      render: (rule: FixedFeeRule) => {
        return rule.rule_type === "percentual"
          ? `${rule.value.toFixed(2)}%`
          : `R$ ${rule.value.toFixed(2)}`;
      }
    }
  ];

  const actions = [
    {
      label: "Editar",
      icon: <Edit className="w-4 h-4" />,
      onClick: (fee: FixedFeeRule) => setEditingFee(fee),
      variant: "outline" as const
    },
    {
      label: "Excluir",
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (fee: FixedFeeRule) => deleteMutation.mutate(fee.id),
      variant: "destructive" as const
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