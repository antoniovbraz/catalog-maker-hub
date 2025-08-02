import { Package, Plus, Upload, Download } from "lucide-react";
import { ConfigurationPageLayout } from "@/components/layout/ConfigurationPageLayout";
import { DataVisualization } from "@/components/ui/data-visualization";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { ProductFormEnhanced } from "@/components/forms/enhanced/ProductFormEnhanced";
import { useProducts, useDeleteProduct } from "@/hooks/useProducts";
import { ProductType } from "@/types/products";
import { useState } from "react";

const Products = () => {
  const { data: products = [], isLoading } = useProducts();
  const deleteMutation = useDeleteProduct();
  const [editingProduct, setEditingProduct] = useState<ProductType | null>(null);

  const configuredProducts = products.filter(p => p.cost_unit && p.category_id).length;

  const columns = [
    { key: "name", header: "Nome", sortable: true },
    { key: "sku", header: "SKU" },
    { 
      key: "cost_unit", 
      header: "Custo Unitário",
      render: (product: ProductType) => `R$ ${product.cost_unit?.toFixed(2) || '0.00'}`
    },
    {
      key: "status",
      header: "Status",
      render: (product: ProductType) => (
        <StatusBadge 
          status={product.cost_unit && product.category_id ? "configured" : "pending"}
        />
      )
    }
  ];

  const actions = [
    {
      label: "Editar",
      icon: <Package className="w-4 h-4" />,
      onClick: (product: ProductType) => setEditingProduct(product),
      variant: "outline" as const
    }
  ];

  const headerActions = (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm">
        <Upload className="w-4 h-4 mr-2" />
        Importar
      </Button>
      <Button variant="outline" size="sm">
        <Download className="w-4 h-4 mr-2" />
        Exportar
      </Button>
      <Button size="sm">
        <Plus className="w-4 h-4 mr-2" />
        Novo Produto
      </Button>
    </div>
  );

  return (
    <ConfigurationPageLayout
      title="Gerenciar Produtos"
      description="Cadastre produtos com custos, impostos e categorias para cálculo preciso de preços"
      icon={<Package className="w-6 h-6" />}
      actions={headerActions}
      progressValue={configuredProducts}
      progressTotal={products.length}
    >
      <div className="xl:col-span-5">
        <ProductFormEnhanced
          editingProduct={editingProduct}
          onCancelEdit={() => setEditingProduct(null)}
        />
      </div>
      <div className="xl:col-span-7">
        <DataVisualization
          title="Produtos Cadastrados"
          data={products}
          columns={columns}
          actions={actions}
          isLoading={isLoading}
        />
      </div>
    </ConfigurationPageLayout>
  );
};

export default Products;