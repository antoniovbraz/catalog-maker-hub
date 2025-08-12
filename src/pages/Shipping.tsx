import { ShippingRuleForm } from "@/components/forms/ShippingRuleForm";
import { ConfigurationPageLayout } from "@/components/layout/ConfigurationPageLayout";
import { Truck, Plus } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { useFormVisibility } from "@/hooks/useFormVisibility";
import { CollapsibleCard } from "@/components/ui/collapsible-card";

const Shipping = () => {
  const { isFormVisible, isListVisible, showForm, hideForm, toggleList } = useFormVisibility({
    formStorageKey: 'shipping-form-visible',
    listStorageKey: 'shipping-list-visible'
  });

  const breadcrumbs = [
    { label: "Configurações", href: "/dashboard" },
    { label: "Regras de Frete" }
  ];

  const headerActions = (
    <div className="flex items-center gap-2">
      <Button size="sm" onClick={showForm}>
        <Plus className="mr-2 size-4" />
        Nova Regra
      </Button>
    </div>
  );

  return (
    <ConfigurationPageLayout
      title="Regras de Frete"
      description="Configure regras de frete por produto e marketplace"
      icon={<Truck className="size-6" />}
      breadcrumbs={breadcrumbs}
      actions={headerActions}
    >
      {isFormVisible && (
        <div className="xl:col-span-6">
          <ShippingRuleForm onCancel={hideForm} />
        </div>
      )}

      {/* Lista externa colapsável */}
      <div className={isFormVisible ? "xl:col-span-6" : "xl:col-span-12"}>
        <CollapsibleCard
          title="Regras de Frete Configuradas"
          icon={<Truck className="size-4" />}
          isOpen={isListVisible}
          onToggle={toggleList}
        >
          <div className="p-4 text-center text-muted-foreground">
            <p>Lista de regras de frete será exibida aqui</p>
            <p className="mt-1 text-sm">Adicione uma nova regra para começar</p>
          </div>
        </CollapsibleCard>
      </div>
    </ConfigurationPageLayout>
  );
};

export default Shipping;
