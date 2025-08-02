import { Calculator, TrendingUp, Target } from "lucide-react";
import { ConfigurationPageLayout } from "@/components/layout";
import { PricingFormEnhanced } from "@/components/forms/enhanced/PricingFormEnhanced";

export default function PricingEnhanced() {
  const breadcrumbs = [
    { label: "Configurações", href: "/dashboard" },
    { label: "Calculadora de Preços" }
  ];

  return (
    <ConfigurationPageLayout
      title="Calculadora de Preços"
      description="Calcule preços sugeridos com base em custos, margens desejadas e taxas de cada marketplace para otimizar sua precificação"
      icon={<Calculator className="h-6 w-6" />}
      breadcrumbs={breadcrumbs}
    >
      <div className="xl:col-span-12">
        <PricingFormEnhanced />
      </div>
    </ConfigurationPageLayout>
  );
}