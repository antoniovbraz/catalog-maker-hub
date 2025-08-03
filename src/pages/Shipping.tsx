import { ShippingRuleForm } from "@/components/forms/ShippingRuleForm";
import { ConfigurationPageLayout } from "@/components/layout/ConfigurationPageLayout";
import { Truck, Plus } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { useFormVisibility } from "@/hooks/useFormVisibility";

const Shipping = () => {
  const { isFormVisible, showForm, hideForm } = useFormVisibility({
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
        <Plus className="w-4 h-4 mr-2" />
        Nova Regra
      </Button>
    </div>
  );

  return (
    <ConfigurationPageLayout
      title="Regras de Frete"
      description="Configure regras de frete por produto e marketplace"
      icon={<Truck className="w-6 h-6" />}
      breadcrumbs={breadcrumbs}
      actions={headerActions}
    >
      {isFormVisible && (
        <div className="xl:col-span-6">
          <ShippingRuleForm onCancel={hideForm} />
        </div>
      )}
    </ConfigurationPageLayout>
  );
};

export default Shipping;
