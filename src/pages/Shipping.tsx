import { ShippingRuleForm } from "@/components/forms/ShippingRuleForm";
import { ShippingRuleModalForm } from "@/components/forms/ShippingRuleModalForm";
import { ConfigurationPageLayout } from "@/components/layout/ConfigurationPageLayout";
import { Truck, Plus } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { useGlobalModal } from "@/hooks/useGlobalModal";

const Shipping = () => {
  const { showFormModal } = useGlobalModal();

  const handleCreateNew = () => {
    let submitForm: (() => Promise<void>) | null = null;

    showFormModal({
      title: "Nova Regra de Frete",
      description: "Crie uma nova regra de frete por produto e marketplace",
      content: (
        <ShippingRuleModalForm
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

  const breadcrumbs = [
    { label: "Configurações", href: "/dashboard" },
    { label: "Regras de Frete" },
  ];

  const headerActions = (
    <div className="flex items-center gap-2">
      <Button size="sm" onClick={handleCreateNew}>
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
      <div className="xl:col-span-12">
        <ShippingRuleForm />
      </div>
    </ConfigurationPageLayout>
  );
};

export default Shipping;

