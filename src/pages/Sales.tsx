import { SalesForm } from "@/components/forms/SalesForm";
import { ConfigurationPageLayout } from "@/components/layout/ConfigurationPageLayout";
import { TrendingUp, Plus } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { useFormVisibility } from "@/hooks/useFormVisibility";

const Sales = () => {
  const { isFormVisible, showForm, hideForm } = useFormVisibility({
    formStorageKey: 'sales-form-visible',
    listStorageKey: 'sales-list-visible'
  });

  const breadcrumbs = [
    { label: "Configurações", href: "/dashboard" },
    { label: "Vendas" }
  ];

  const headerActions = (
    <div className="flex items-center gap-2">
      <Button size="sm" onClick={showForm}>
        <Plus className="mr-2 size-4" />
        Nova Venda
      </Button>
    </div>
  );

  return (
    <ConfigurationPageLayout
      title="Registrar Vendas"
      description="Registre suas vendas para análise de margens reais e performance"
      icon={<TrendingUp className="size-6" />}
      breadcrumbs={breadcrumbs}
      actions={headerActions}
    >
      {isFormVisible && (
        <div className="lg:col-span-8 xl:col-span-8">
          <SalesForm onCancel={hideForm} />
        </div>
      )}
    </ConfigurationPageLayout>
  );
};

export default Sales;
