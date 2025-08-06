import { ProductForm } from "@/components/forms/ProductForm";
import { ConfigurationPageLayout } from "@/components/layout/ConfigurationPageLayout";
import { Package, Plus } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { useFormVisibility } from "@/hooks/useFormVisibility";

const Products = () => {
  const { isFormVisible, showForm } = useFormVisibility({
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
        <Plus className="mr-2 size-4" />
        Novo Produto
      </Button>
    </div>
  );

  return (
    <ConfigurationPageLayout
      title="Gerenciar Produtos"
      description="Cadastre e gerencie produtos com custos, impostos e categorias"
      icon={<Package className="size-6" />}
      breadcrumbs={breadcrumbs}
      actions={headerActions}
    >
      {isFormVisible && (
        <div className="lg:col-span-12 xl:col-span-12">
          <ProductForm />
        </div>
      )}
    </ConfigurationPageLayout>
  );
};

export default Products;
