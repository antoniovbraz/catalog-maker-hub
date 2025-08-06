import { PricingForm } from "@/components/forms/PricingForm";
import { ConfigurationPageLayout } from "@/components/layout/ConfigurationPageLayout";
import { Calculator, Plus } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { useFormVisibility } from "@/hooks/useFormVisibility";

const Pricing = () => {
  const { isFormVisible, showForm } = useFormVisibility({
    formStorageKey: 'pricing-form-visible',
    listStorageKey: 'pricing-list-visible'
  });

  const breadcrumbs = [
    { label: "Configurações", href: "/dashboard" },
    { label: "Precificação" }
  ];

  const headerActions = (
    <div className="flex items-center gap-2">
      <Button size="sm" onClick={showForm}>
        <Plus className="size-4 mr-2" />
        Calcular Preço
      </Button>
    </div>
  );

  return (
    <ConfigurationPageLayout
      title="Precificação"
      description="Calcule preços sugeridos e margens de lucro para seus produtos"
      icon={<Calculator className="size-6" />}
      breadcrumbs={breadcrumbs}
      actions={headerActions}
    >
      {isFormVisible && (
        <div className="lg:col-span-12 xl:col-span-12">
          <PricingForm />
        </div>
      )}
    </ConfigurationPageLayout>
  );
};

export default Pricing;
