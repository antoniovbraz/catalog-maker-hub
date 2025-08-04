import { StrategyForm } from "@/components/forms/StrategyForm";
import { ConfigurationPageLayout } from "@/components/layout/ConfigurationPageLayout";
import { BarChart3, Plus } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { useFormVisibility } from "@/hooks/useFormVisibility";

const Strategy = () => {
  const { isFormVisible, showForm, hideForm } = useFormVisibility({
    formStorageKey: 'strategy-form-visible',
    listStorageKey: 'strategy-list-visible'
  });

  const breadcrumbs = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Estratégia" }
  ];

  const headerActions = (
    <div className="flex items-center gap-2">
      <Button size="sm" onClick={showForm}>
        <Plus className="w-4 h-4 mr-2" />
        Analisar
      </Button>
    </div>
  );

  return (
    <ConfigurationPageLayout
      title="Estratégia de Precificação"
      description="Analise produtos por margem e giro de vendas usando matriz estratégica"
      icon={<BarChart3 className="w-6 h-6" />}
      breadcrumbs={breadcrumbs}
      actions={headerActions}
    >
      {isFormVisible && (
        <div className="lg:col-span-12 xl:col-span-12">
          <StrategyForm onCancel={hideForm} />
        </div>
      )}
    </ConfigurationPageLayout>
  );
};

export default Strategy;