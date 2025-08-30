import { Package, Plus, Edit, Trash2, Tag, Download, ExternalLink } from "@/components/ui/icons";
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
import { ProductSourceBadge } from "@/components/common/ProductSourceBadge";
import { useMLIntegration, useMLSync } from "@/hooks/useMLIntegration";
import { useMLProducts } from "@/hooks/useMLProducts";
import { useMLResync } from "@/hooks/useMLResync";
import { MLAdvertiseModal } from "@/components/forms/MLAdvertiseModal";
import { MLConflictModal } from "@/components/forms/MLConflictModal";
import type { MLSyncProduct } from "@/services/ml-service";
import { Link } from "react-router-dom";

export default function Products() {
  const { data: products = [], isLoading } = useProductsWithCategories();
  const { data: mlProducts = [] } = useMLProducts();
  const { importFromML } = useMLSync();
  const { resyncProduct } = useMLResync();
  const deleteMutation = useDeleteProduct();
  const { showFormModal, showConfirmModal } = useGlobalModal();

  const columns: DataColumn<ProductWithCategory>[] = [
    {
      key: "name",
      header: "Nome",
      render: (item) => {
        const mlProduct = mlProducts.find(ml => ml.id === item.id);
        const hasIncompleteData = item.source === 'mercado_livre' && (!item.description || !item.sku || !item.brand);
        
        return (
          <div className="flex items-center gap-2">
            <Package className="size-4 text-muted-foreground" />
            <div className="flex items-center gap-2">
              <Link 
                to={`/products/${item.id}`}
                className="font-medium hover:text-primary transition-colors cursor-pointer"
              >
                {item.name}
              </Link>
              {hasIncompleteData && (
                <Badge variant="outline" className="text-orange-600 border-orange-300">
                  Dados Incompletos
                </Badge>
              )}
              {item.sku && (
                <Badge variant="outline" className="text-xs">
                  {item.sku}
                </Badge>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: "source",
      header: "Origem",
      render: (item) => {
        const mlProduct = (mlProducts || []).find(ml => ml.id === item.id);
        return (
          <ProductSourceBadge 
            source={item.source} 
            mlStatus={mlProduct?.sync_status}
            mlItemId={mlProduct?.ml_item_id}
          />
        );
      },
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

  const checkForConflicts = async (product: ProductWithCategory): Promise<MLSyncProduct[]> => {
    // Simular verificação de conflitos
    const existingProducts = (mlProducts || []).filter(ml => 
      ml.name.toLowerCase().includes(product.name.toLowerCase()) ||
      (product.sku && ml.name.toLowerCase().includes(product.sku.toLowerCase()))
    );

    return existingProducts;
  };

  const handleAdvertiseOnML = async (product: ProductWithCategory) => {
    // Verificar conflitos primeiro
    const conflicts = await checkForConflicts(product);
    
    if (conflicts.length > 0) {
      // Mostrar modal de conflitos
      let submitForm: (() => Promise<void>) | null = null;

      showFormModal({
        title: "Produto Similares Encontrados",
        description: `Encontramos produtos similares no Mercado Livre. Como deseja proceder?`,
        content: (
          <MLConflictModal
            product={product}
            conflicts={conflicts}
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
    } else {
      // Prosseguir com criação normal
      let submitForm: (() => Promise<void>) | null = null;

      showFormModal({
        title: "Anunciar no Mercado Livre",
        description: `Criar anúncio para "${product.name}"`,
        content: (
          <MLAdvertiseModal
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
    }
  };

  const getActionsForProduct = (product: ProductWithCategory): DataAction<ProductWithCategory>[] => {
    const mlProduct = mlProducts.find(ml => ml.id === product.id);
    const hasIncompleteData = product.source === 'mercado_livre' && (!product.description || !product.sku || !product.brand);
    
    const baseActions: DataAction<ProductWithCategory>[] = [
      {
        label: "Editar",
        icon: <Edit className="size-4" />,
        onClick: (product) => handleEdit(product),
      }
    ];

    // Ação de re-sincronização para produtos ML com dados incompletos
    if (hasIncompleteData) {
      baseActions.push({
        label: "Re-sincronizar",
        icon: <Package className="size-4" />,
        onClick: (product) => resyncProduct.mutate({ productId: product.id }),
        variant: "outline",
        disabled: () => resyncProduct.isPending,
      });
    }

    // Ações condicionais baseadas na origem
    if (product.source === 'manual') {
      baseActions.push({
        label: "Anunciar no ML",
        icon: <Tag className="size-4" />,
        onClick: (product) => handleAdvertiseOnML(product),
        variant: "default",
      });
    } else if (product.source === 'mercado_livre' && mlProduct?.ml_item_id) {
      baseActions.push({
        label: "Ver no ML",
        icon: <ExternalLink className="size-4" />,
        onClick: () => {
          window.open(`https://www.mercadolivre.com.br/MLB-${mlProduct.ml_item_id}`, '_blank');
        },
        variant: "outline",
      });
    }

    baseActions.push({
      label: "Excluir",
      icon: <Trash2 className="size-4" />,
      onClick: (product) => handleDelete(product),
      variant: "destructive",
    });

    return baseActions;
  };

  const actions: DataAction<ProductWithCategory>[] = [
    {
      label: "Editar",
      icon: <Edit className="size-4" />,
      onClick: (product) => handleEdit(product),
    },
    {
      label: "Anunciar no ML",
      icon: <Tag className="size-4" />,
      onClick: (product) => handleAdvertiseOnML(product),
      variant: "default",
      disabled: (product) => product.source !== 'manual',
    },
    {
      label: "Ver no ML",
      icon: <Package className="size-4" />,
      onClick: (product) => {
        // TODO: Abrir link do ML
        console.log('View on ML:', product);
      },
      variant: "outline",
      disabled: (product) => product.source !== 'mercado_livre',
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
    <div className="flex gap-2">
      <Button size="sm" variant="outline" onClick={() => importFromML.mutate()} disabled={importFromML.isPending}>
        <Download className="mr-2 size-4" />
        {importFromML.isPending ? 'Importando...' : 'Importar do ML'}
      </Button>
      <Button size="sm" onClick={handleCreateNew}>
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

