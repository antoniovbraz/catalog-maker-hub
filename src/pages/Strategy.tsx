import { StrategyForm } from "@/components/forms/StrategyForm";
import { ConfigurationPageLayout } from "@/components/layout/ConfigurationPageLayout";
import { BarChart3 } from "@/components/ui/icons";

const Strategy = () => {
  const breadcrumbs = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Estratégia" }
  ];

  return (
    <ConfigurationPageLayout
      title="Estratégia de Precificação"
      description="Analise produtos por margem e giro de vendas usando matriz estratégica"
      icon={<BarChart3 className="w-6 h-6" />}
      breadcrumbs={breadcrumbs}
    >
      <div className="xl:col-span-12">
        <StrategyForm />
      </div>
    </ConfigurationPageLayout>
  );
};

export default Strategy;