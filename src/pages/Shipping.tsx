import { ShippingRuleForm } from "@/components/forms/ShippingRuleForm";
import { ConfigurationPageLayout } from "@/components/layout/ConfigurationPageLayout";
import { Truck } from "@/components/ui/icons";

const Shipping = () => {
  const breadcrumbs = [
    { label: "Configurações", href: "/dashboard" },
    { label: "Regras de Frete" }
  ];

  return (
    <ConfigurationPageLayout
      title="Regras de Frete"
      description="Configure regras de frete por produto e marketplace"
      icon={<Truck className="w-6 h-6" />}
      breadcrumbs={breadcrumbs}
    >
      <div className="xl:col-span-6">
        <ShippingRuleForm />
      </div>
    </ConfigurationPageLayout>
  );
};

export default Shipping;
