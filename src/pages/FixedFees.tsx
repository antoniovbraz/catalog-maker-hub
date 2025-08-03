import { FixedFeeRuleForm } from "@/components/forms/FixedFeeRuleForm";
import { ConfigurationPageLayout } from "@/components/layout/ConfigurationPageLayout";
import { Coins } from "@/components/ui/icons";

const FixedFees = () => {
  const breadcrumbs = [
    { label: "Configurações", href: "/dashboard" },
    { label: "Regras de valor fixo" }
  ];

  return (
    <ConfigurationPageLayout
      title="Regras de valor fixo"
      description="Configure regras de valor fixo por marketplace com diferentes tipos"
      icon={<Coins className="w-6 h-6" />}
      breadcrumbs={breadcrumbs}
    >
      <div className="xl:col-span-6">
        <FixedFeeRuleForm />
      </div>
    </ConfigurationPageLayout>
  );
};

export default FixedFees;