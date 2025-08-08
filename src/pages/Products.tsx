import { useState } from "react";
import { ProductForm } from "@/components/forms/ProductForm";
import { ProductList } from "@/components/product/ProductList";
import { ConfigurationPageLayout } from "@/components/layout/ConfigurationPageLayout";
import { Package, Plus } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { useFormVisibility } from "@/hooks/useFormVisibility";
import { ProductWithCategory } from "@/types/products";

const Products = () => {
  const [editingProduct, setEditingProduct] = useState<ProductWithCategory | null>(null);
  const { isFormVisible, isListVisible, showForm, hideForm, toggleList } = useFormVisibility({
    formStorageKey: 'products-form-visible',
    listStorageKey: 'products-list-visible'
  });

  const handleCreateNew = () => {
    setEditingProduct(null);
    showForm();
  };

  const handleEdit = (product: ProductWithCategory) => {
    setEditingProduct(product);
    showForm();
  };

  const handleCancel = () => {
    setEditingProduct(null);
    hideForm();
  };

  const breadcrumbs = [
    { label: "Configurações", href: "/dashboard" },
    { label: "Produtos" }
  ];

  const headerActions = (
    <div className="flex items-center gap-2">
      <Button size="sm" onClick={handleCreateNew}>
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
        <div className="xl:col-span-5">
          <ProductForm editingProduct={editingProduct} onCancel={handleCancel} />
        </div>
      )}

      <div className={isFormVisible ? "xl:col-span-7" : "xl:col-span-12"}>
        <ProductList
          onEdit={handleEdit}
          isListVisible={isListVisible}
          toggleList={toggleList}
        />
      </div>
    </ConfigurationPageLayout>
  );
};

export default Products;
