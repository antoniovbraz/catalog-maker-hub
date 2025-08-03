import { CommissionForm } from "@/components/forms/CommissionForm";
import { ConfigurationPageLayout } from "@/components/layout/ConfigurationPageLayout";
import { Percent } from "@/components/ui/icons";

const Commissions = () => {
  const breadcrumbs = [
    { label: "Configurações", href: "/dashboard" },
    { label: "Comissões" }
  ];

  return (
    <ConfigurationPageLayout
      title="Comissões"
      description="Configure comissões por marketplace e categoria"
      icon={<Percent className="w-6 h-6" />}
      breadcrumbs={breadcrumbs}
    >
      <div className="xl:col-span-6">
        <CommissionForm />
      </div>
    </ConfigurationPageLayout>
  );
};

export default Commissions;