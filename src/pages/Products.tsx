import { Package, Plus, Edit, Trash2, Tag } from "@/components/ui/icons";
import { ConfigurationPageLayout } from "@/components/layout/ConfigurationPageLayout";
import { Button } from "@/components/ui/button";
import { DataVisualization } from "@/components/ui/data-visualization";
import type { DataColumn, DataAction } from "@/components/ui/data-visualization";
import { Badge } from "@/components/ui/badge";
import { formatarMoeda } from "@/utils/pricing";
import { useProductsWithCategories, useDeleteProduct } from "@/hooks/useProducts";
import type { ProductWithCategory } from "@/types/products";
import { useGlobalModal } from "@/hooks/useGlobalModal";
import { ProductModalForm } from "@/components/forms/ProductModalForm";

export default function Products() {
  const { data: products = [], isLoading } = useProductsWithCategories();
  const deleteMutation = useDeleteProduct();
  const { showFormModal, showConfirmModal } = useGlobalModal();

  const columns: DataColumn<ProductWithCategory>[] = [
    {
      key: "name",
      header: "Nome",
      render: (item) => (
        <div className="flex items-center gap-2">
          <Package className="size-4 text-muted-foreground" />
          <div>
            <span className="font-medium">{item.name}</span>
            {item.sku && (
              <Badge variant="outline" className="ml-2 text-xs">
                {item.sku}
              </Badge>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "categories.name",
      header: "Categoria",
      render: (item) => (
        <div className="flex items-center gap-1">
          <Tag className="size-3 text-muted-foreground" />
          <span>{item.categories?.name || "Sem categoria"}</span>
        </div>
      ),
    },
    {
      key: "cost_unit",
      header: "Custo Unit.",
      render: (item) => (
        <span className="font-mono text-sm">{formatarMoeda(item.cost_unit || 0)}</span>
      ),
    },
    {
      key: "packaging_cost",
      header: "Embalagem",
      render: (item) => (
        <span className="font-mono text-sm text-muted-foreground">
          {formatarMoeda(item.packaging_cost || 0)}
        </span>
      ),
    },
  ];

  const handleDelete = (product: ProductWithCategory) => {
    showConfirmModal({
      title: "Excluir Produto",
      description: `Tem certeza que deseja excluir o produto "${product.name}"? Esta ação não pode ser desfeita.`,
      onConfirm: async () => {
        await deleteMutation.mutateAsync(product.id);
      },
      confirmText: "Excluir",
      variant: "destructive",
    });
  };

  const handleEdit = (product: ProductWithCategory) => {
    let submitForm: (() => Promise<void>) | null = null;

    showFormModal({
      title: "Editar Produto",
      description: "Atualize as informações do produto",
      content: (
        <ProductModalForm
          product={product}
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

  const handleCreateNew = () => {
    let submitForm: (() => Promise<void>) | null = null;

    showFormModal({
      title: "Novo Produto",
      description: "Cadastre um novo produto",
      content: (
        <ProductModalForm
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

  const actions: DataAction<ProductWithCategory>[] = [
    {
      label: "Editar",
      icon: <Edit className="size-4" />,
      onClick: (product) => handleEdit(product),
    },
    {
      label: "Excluir",
      icon: <Trash2 className="size-4" />,
      onClick: (product) => handleDelete(product),
      variant: "destructive",
    },
  ];

  const breadcrumbs = [
    { label: "Configurações", href: "/dashboard" },
    { label: "Produtos" },
  ];

  const headerActions = (
    <Button size="sm" onClick={handleCreateNew}>
      <Plus className="mr-2 size-4" />
      Novo Produto
    </Button>
  );

  return (
    <ConfigurationPageLayout
      title="Gerenciar Produtos"
      description="Cadastre e gerencie produtos com custos, impostos e categorias"
      icon={<Package className="size-6" />}
      breadcrumbs={breadcrumbs}
      actions={headerActions}
    >
      <div className="xl:col-span-12">
        <DataVisualization
          title="Produtos"
          data={products}
          columns={columns}
          actions={actions}
          isLoading={isLoading}
          emptyState={
            <div className="py-8 text-center">
              <p className="text-muted-foreground">Nenhum produto cadastrado</p>
              <p className="text-sm text-muted-foreground">
                Crie seu primeiro produto usando o botão acima
              </p>
            </div>
          }
        />
      </div>
    </ConfigurationPageLayout>
  );
}

