import { FixedFeeRuleForm } from "@/components/forms/FixedFeeRuleForm";
import { ConfigurationPageLayout } from "@/components/layout/ConfigurationPageLayout";
import { Coins, Plus } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { useFormVisibility } from "@/hooks/useFormVisibility";
import { CollapsibleCard } from "@/components/ui/collapsible-card";

const FixedFees = () => {
  const { isFormVisible, isListVisible, showForm, hideForm, toggleList } = useFormVisibility({
    formStorageKey: 'fixed-fees-form-visible',
    listStorageKey: 'fixed-fees-list-visible'
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

      {/* Lista externa colapsável */}
      <div className={isFormVisible ? "xl:col-span-6" : "xl:col-span-12"}>
        <CollapsibleCard
          title="Taxas Fixas Configuradas"
          icon={<Coins className="w-4 h-4" />}
          isOpen={isListVisible}
          onToggle={toggleList}
        >
          <div className="p-4 text-center text-muted-foreground">
            <p>Lista de taxas fixas será exibida aqui</p>
            <p className="text-sm mt-1">Adicione uma nova taxa para começar</p>
          </div>
        </CollapsibleCard>
      </div>
    </ConfigurationPageLayout>
  );
};

export default FixedFees;