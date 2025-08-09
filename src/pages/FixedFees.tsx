import { useState } from "react";
import { FixedFeeRuleForm } from "@/components/forms/FixedFeeRuleForm";
import { ConfigurationPageLayout } from "@/components/layout/ConfigurationPageLayout";
import { Coins, Plus, Eye, EyeOff } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { useFormVisibility } from "@/hooks/useFormVisibility";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { FixedFeesTable } from "@/components/fixed-fees/FixedFeesTable";
import { FixedFeeRule } from "@/types/fixed-fees";

const FixedFees = () => {
  const [editingRule, setEditingRule] = useState<FixedFeeRule | null>(null);
  const { isFormVisible, isListVisible, showForm, hideForm, toggleList } = useFormVisibility({
    formStorageKey: 'fixed-fees-form-visible',
    listStorageKey: 'fixed-fees-list-visible'
  });

  const handleEdit = (rule: FixedFeeRule) => {
    setEditingRule(rule);
    showForm();
  };

  const handleFormCancel = () => {
    setEditingRule(null);
    hideForm();
  };

  const breadcrumbs = [
    { label: "Configurações", href: "/dashboard" },
    { label: "Regras de valor fixo" }
  ];

  const headerActions = (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleList}
        aria-label={isListVisible ? 'Ocultar lista' : 'Mostrar lista'}
      >
        {isListVisible ? (
          <EyeOff className="w-4 h-4" aria-hidden="true" />
        ) : (
          <Eye className="w-4 h-4" aria-hidden="true" />
        )}
      </Button>
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
          <FixedFeeRuleForm onCancel={handleFormCancel} editingRule={editingRule} />
        </div>
      )}

      <div className={isFormVisible ? "xl:col-span-6" : "xl:col-span-12"}>
        <CollapsibleCard
          title="Taxas Fixas Configuradas"
          icon={<Coins className="w-4 h-4" />}
          isOpen={isListVisible}
          onToggle={toggleList}
        >
          <FixedFeesTable onEdit={handleEdit} />
        </CollapsibleCard>
      </div>
    </ConfigurationPageLayout>
  );
};

export default FixedFees;
