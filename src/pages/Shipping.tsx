import { ShippingRuleForm } from "@/components/forms/ShippingRuleForm";
import { ConfigurationPageLayout } from "@/components/layout/ConfigurationPageLayout";
import { Truck, Plus } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { useFormVisibility } from "@/hooks/useFormVisibility";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { EmptyState } from "@/components/ui/empty-state";

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
        <div className="lg:col-span-6 xl:col-span-6">
          <ShippingRuleForm onCancel={hideForm} />
        </div>
      )}

      {/* Lista externa colapsável */}
      <div
        className={
          isFormVisible
            ? "lg:col-span-6 xl:col-span-6"
            : "lg:col-span-12 xl:col-span-12"
        }
      >
        <CollapsibleCard
          title="Regras de Frete Configuradas"
          icon={<Truck className="size-4" />}
          isOpen={isListVisible}
          onToggle={toggleList}
        >
          <EmptyState
            icon={<Truck className="size-8" />}
            title="Nenhuma regra de frete configurada"
            description="Adicione uma nova regra para começar"
            action={{
              label: "Nova Regra",
              onClick: showForm,
              icon: <Plus className="mr-2 size-4" />,
            }}
          />
        </CollapsibleCard>
      </div>
    </ConfigurationPageLayout>
  );
};

export default Shipping;
