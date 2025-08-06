import { ProductForm } from "@/components/forms/ProductForm";
import { ConfigurationPageLayout } from "@/components/layout/ConfigurationPageLayout";
import { Package, Plus } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { BaseCard, CardListItem } from "@/components/ui";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useProducts } from "@/hooks/useProducts";
import { useFormVisibility } from "@/hooks/useFormVisibility";

const Products = () => {
  const { data: products = [], isLoading } = useProducts();
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
        <div className="w-full max-w-4xl lg:col-span-12 xl:col-span-12">
          <ProductForm />
        </div>
      )}

      {!isFormVisible && (
        <div className="lg:col-span-12 xl:col-span-12">
          <BaseCard
            title={
              <div className="flex items-center gap-2">
                <Package className="size-5" />
                <span>Produtos Cadastrados</span>
              </div>
            }
          >
            {isLoading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <EmptyState
                icon={<Package className="size-8" />}
                title="Nenhum produto cadastrado"
                description="Cadastre seu primeiro produto para começar"
                action={{
                  label: "Novo Produto",
                  onClick: showForm,
                  icon: <Plus className="mr-2 size-4" />,
                }}
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((product: any) => (
                  <CardListItem
                    key={product.id}
                    title={product.name}
                    subtitle={product.categories?.name || "Sem categoria"}
                  />
                ))}
              </div>
            )}
          </BaseCard>
        </div>
      )}
    </ConfigurationPageLayout>
  );
};

export default Products;
