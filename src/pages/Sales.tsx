import { SalesForm } from "@/components/forms/SalesForm";
import { SalesModalForm } from "@/components/forms/SalesModalForm";
import { ConfigurationPageLayout } from "@/components/layout/ConfigurationPageLayout";
import { TrendingUp, Plus } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { useGlobalModal } from "@/hooks/useGlobalModal";

const Sales = () => {
  const { showFormModal } = useGlobalModal();

  const handleCreateNew = () => {
    let submitForm: (() => Promise<void>) | null = null;

    showFormModal({
      title: "Registrar Venda",
      description: "Informe os dados da venda",
      content: (
        <SalesModalForm
          onSuccess={() => {}}
          onSubmitForm={(fn) => {
            submitForm = fn;
          }}
        />
      ),
      onSave: async () => {
        if (submitForm) await submitForm();
      },
      size: "lg",
    });
  };

  const breadcrumbs = [
    { label: "Configurações", href: "/dashboard" },
    { label: "Vendas" }
  ];

  const headerActions = (
    <div className="flex items-center gap-2">
      <Button size="sm" onClick={handleCreateNew}>
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
      <div className="xl:col-span-8">
        <SalesForm showForm={false} />
      </div>
    </ConfigurationPageLayout>
  );
};

export default Sales;
