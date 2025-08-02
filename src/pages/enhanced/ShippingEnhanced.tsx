import { Truck, Calculator, Settings } from "lucide-react";
import { ConfigurationPageLayout } from "@/components/layout";
import { ShippingRuleFormEnhanced } from "@/components/forms/enhanced/ShippingRuleFormEnhanced";

export default function ShippingEnhanced() {
  const breadcrumbs = [
    { label: "Configurações", href: "/dashboard" },
    { label: "Regras de Frete" }
  ];

  return (
    <ConfigurationPageLayout
      title="Regras de Frete"
      description="Configure regras de frete personalizadas por produto e marketplace para cálculos precisos de precificação"
      icon={<Truck className="h-6 w-6" />}
      breadcrumbs={breadcrumbs}
    >
      <div className="xl:col-span-12">
        <ShippingRuleFormEnhanced />
      </div>
    </ConfigurationPageLayout>
  );
}