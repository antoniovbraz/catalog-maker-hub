import { MarketplaceForm } from "@/components/forms/MarketplaceForm";
import { ConfigurationPageLayout } from "@/components/layout/ConfigurationPageLayout";
import { Store } from "@/components/ui/icons";

const Marketplaces = () => {
  const breadcrumbs = [
    { label: "Configurações", href: "/dashboard" },
    { label: "Marketplaces" }
  ];

  return (
    <ConfigurationPageLayout
      title="Gerenciar Marketplaces"
      description="Cadastre e gerencie os marketplaces onde seus produtos são vendidos"
      icon={<Store className="w-6 h-6" />}
      breadcrumbs={breadcrumbs}
    >
      <div className="xl:col-span-6">
        <MarketplaceForm />
      </div>
    </ConfigurationPageLayout>
  );
};

export default Marketplaces;
