import { Target, TrendingUp, BarChart3 } from "lucide-react";
import { ConfigurationPageLayout } from "@/components/layout";
import { StrategyFormEnhanced } from "@/components/forms/enhanced/StrategyFormEnhanced";

export default function StrategyEnhanced() {
  const breadcrumbs = [
    { label: "Configurações", href: "/dashboard" },
    { label: "Estratégia de Precificação" }
  ];

  return (
    <ConfigurationPageLayout
      title="Estratégia de Precificação"
      description="Analise produtos por margem e giro de vendas usando matriz estratégica BCG para otimizar sua carteira de produtos"
      icon={<Target className="h-6 w-6" />}
      breadcrumbs={breadcrumbs}
    >
      <div className="xl:col-span-12">
        <StrategyFormEnhanced />
      </div>
    </ConfigurationPageLayout>
  );
}