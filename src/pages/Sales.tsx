import { SalesForm } from "@/components/forms/SalesForm";
import { ConfigurationPageLayout } from "@/components/layout/ConfigurationPageLayout";
import { TrendingUp } from "@/components/ui/icons";

const Sales = () => {
  const breadcrumbs = [
    { label: "Configurações", href: "/dashboard" },
    { label: "Vendas" }
  ];

  return (
    <ConfigurationPageLayout
      title="Registrar Vendas"
      description="Registre suas vendas para análise de margens reais e performance"
      icon={<TrendingUp className="w-6 h-6" />}
      breadcrumbs={breadcrumbs}
    >
      <div className="xl:col-span-8">
        <SalesForm />
      </div>
    </ConfigurationPageLayout>
  );
};

export default Sales;
