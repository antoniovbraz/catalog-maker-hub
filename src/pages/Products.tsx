import { ProductForm } from "@/components/forms/ProductForm";
import { ConfigurationPageLayout } from "@/components/layout/ConfigurationPageLayout";
import { Package, Plus } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { useFormVisibility } from "@/hooks/useFormVisibility";

const Products = () => {
  const { isFormVisible, showForm, hideForm } = useFormVisibility({
    formStorageKey: 'products-form-visible',
    listStorageKey: 'products-list-visible'
  });

  const breadcrumbs = [
    { label: "Configurações", href: "/dashboard" },
    { label: "Produtos" }
  ];

  const headerActions = (
    <div className="flex items-center gap-2">
      <Button size="sm" onClick={showForm}>
        <Plus className="w-4 h-4 mr-2" />
        Novo Produto
      </Button>
    </div>
  );

  return (
    <ConfigurationPageLayout
      title="Gerenciar Produtos"
      description="Cadastre e gerencie produtos com custos, impostos e categorias"
      icon={<Package className="w-6 h-6" />}
      breadcrumbs={breadcrumbs}
      actions={headerActions}
    >
      {isFormVisible && (
        <div className="xl:col-span-12">
          <ProductForm />
        </div>
      )}
    </ConfigurationPageLayout>
  );
};

export default Products;
