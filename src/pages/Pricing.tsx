import { PricingForm } from "@/components/forms/PricingForm";
import { ConfigurationPageLayout } from "@/components/layout/ConfigurationPageLayout";
import { Calculator } from "@/components/ui/icons";

const Pricing = () => {
  const breadcrumbs = [
    { label: "Configurações", href: "/dashboard" },
    { label: "Precificação" }
  ];

  return (
    <ConfigurationPageLayout
      title="Precificação"
      description="Calcule preços sugeridos e margens de lucro para seus produtos"
      icon={<Calculator className="w-6 h-6" />}
      breadcrumbs={breadcrumbs}
    >
      <PricingForm />
    </ConfigurationPageLayout>
  );
};

export default Pricing;
