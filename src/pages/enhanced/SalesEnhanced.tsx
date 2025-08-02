import { Receipt, TrendingUp, DollarSign } from "lucide-react";
import { ConfigurationPageLayout } from "@/components/layout";
import { SalesFormEnhanced } from "@/components/forms/enhanced/SalesFormEnhanced";

export default function SalesEnhanced() {
  const breadcrumbs = [
    { label: "Configurações", href: "/dashboard" },
    { label: "Registro de Vendas" }
  ];

  return (
    <ConfigurationPageLayout
      title="Registro de Vendas"
      description="Registre vendas realizadas para análise de margens reais e performance dos produtos em diferentes marketplaces"
      icon={<Receipt className="h-6 w-6" />}
      breadcrumbs={breadcrumbs}
    >
      <div className="xl:col-span-12">
        <SalesFormEnhanced />
      </div>
    </ConfigurationPageLayout>
  );
}