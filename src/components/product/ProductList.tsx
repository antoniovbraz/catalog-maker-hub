import { Package, Tag, Edit, Trash2 } from '@/components/ui/icons';
import { DataVisualization } from '@/components/ui/data-visualization';
import { CollapsibleCard } from '@/components/ui/collapsible-card';
import { Badge } from '@/components/ui/badge';
import { useProductsWithCategories, useDeleteProduct } from '@/hooks/useProducts';
import { ProductWithCategory } from '@/types/products';
import { formatarMoeda } from '@/utils/pricing';

interface ProductListProps {
  onEdit: (product: ProductWithCategory) => void;
  isListVisible: boolean;
  toggleList: () => void;
}

export const ProductList = ({ onEdit, isListVisible, toggleList }: ProductListProps) => {
  const { data: products = [], isLoading } = useProductsWithCategories();
  const deleteMutation = useDeleteProduct();

  const columns = [
    {
      key: 'name',
      header: 'Nome',
      render: (item: ProductWithCategory) => (
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-muted-foreground" />
          <div>
            <span className="font-medium">{item.name}</span>
            {item.sku && (
              <Badge variant="outline" className="ml-2 text-xs">
                {item.sku}
              </Badge>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'categories.name',
      header: 'Categoria',
      render: (item: ProductWithCategory) => (
        <div className="flex items-center gap-1">
          <Tag className="w-3 h-3 text-muted-foreground" />
          <span>{item.categories?.name || 'Sem categoria'}</span>
        </div>
      )
    },
    {
      key: 'cost_unit',
      header: 'Custo Unit.',
      render: (item: ProductWithCategory) => (
        <span className="font-mono text-sm">{formatarMoeda(item.cost_unit || 0)}</span>
      )
    },
    {
      key: 'packaging_cost',
      header: 'Embalagem',
      render: (item: ProductWithCategory) => (
        <span className="font-mono text-sm text-muted-foreground">
          {formatarMoeda(item.packaging_cost || 0)}
        </span>
      )
    }
  ];

  const actions = [
    {
      label: 'Editar',
      icon: <Edit className="w-4 h-4" />,
      onClick: (product: ProductWithCategory) => onEdit(product)
    },
    {
      label: 'Excluir',
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (product: ProductWithCategory) => deleteMutation.mutate(product.id),
      variant: 'destructive' as const
    }
  ];

  return (
    <CollapsibleCard
      title="Produtos Cadastrados"
      icon={<Package className="w-4 h-4" />}
      isOpen={isListVisible}
      onToggle={toggleList}
    >
      <DataVisualization
        title=""
        data={products}
        columns={columns}
        actions={actions}
        isLoading={isLoading}
        emptyState={
          <div className="text-center py-8">
            <p className="text-muted-foreground">Nenhum produto cadastrado</p>
            <p className="text-sm text-muted-foreground">
              Crie seu primeiro produto usando o formulário ao lado
            </p>
          </div>
        }
      />
    </CollapsibleCard>
  );
};
