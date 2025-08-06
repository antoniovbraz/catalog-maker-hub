import { CategoryForm } from "@/components/forms/CategoryForm";
import { ConfigurationPageLayout } from "@/components/layout/ConfigurationPageLayout";
import { FolderTree, Plus, Edit, Trash2 } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFormVisibility } from "@/hooks/useFormVisibility";
import { useCategories, useDeleteCategory } from "@/hooks/useCategories";
import { CategoryType } from "@/types/categories";
import { DataVisualization } from "@/components/ui/data-visualization";
import { useState } from "react";
import { Text } from "@/components/ui/typography";

const Categories = () => {
  const [editingCategory, setEditingCategory] = useState<CategoryType | null>(null);
  const { isFormVisible, showForm, hideForm } = useFormVisibility({
    formStorageKey: 'categories-form-visible',
    listStorageKey: 'categories-list-visible'
  });

  const { data: categories = [], isLoading } = useCategories();
  const deleteMutation = useDeleteCategory();

  const handleEdit = (category: CategoryType) => {
    setEditingCategory(category);
    showForm();
  };

  const handleFormCancel = () => {
    setEditingCategory(null);
    hideForm();
  };

  // Configurar colunas da tabela
  const columns = [
    {
      key: 'name',
      header: 'Nome',
      render: (item: CategoryType) => (
        <div className="flex items-center gap-2">
          <FolderTree className="size-4 text-muted-foreground" />
          <span className="font-medium">{item.name}</span>
        </div>
      )
    },
    {
      key: 'description',
      header: 'Descrição',
      render: (item: CategoryType) => (
        <span className="text-muted-foreground">
          {item.description || "Sem descrição"}
        </span>
      )
    }
  ];

  const actions = [
    {
      label: 'Editar',
      icon: <Edit className="size-4" />,
      onClick: (category: CategoryType) => handleEdit(category)
    },
    {
      label: 'Excluir',
      icon: <Trash2 className="size-4" />,
      onClick: (category: CategoryType) => deleteMutation.mutate(category.id),
      variant: 'destructive' as const
    }
  ];

  const breadcrumbs = [
    { label: "Configurações", href: "/dashboard" },
    { label: "Categorias" }
  ];

  const headerActions = (
    <div className="flex items-center gap-2">
      <Button size="sm" onClick={showForm}>
        <Plus className="mr-2 size-4" />
        Nova Categoria
      </Button>
    </div>
  );

  return (
    <ConfigurationPageLayout
      title="Gerenciar Categorias"
      description="Organize seus produtos em categorias para melhor gestão"
      icon={<FolderTree className="size-6" />}
      breadcrumbs={breadcrumbs}
      actions={headerActions}
    >
      {isFormVisible && (
        <div className="lg:col-span-6 xl:col-span-6">
          <CategoryForm onCancel={handleFormCancel} editingCategory={editingCategory} />
        </div>
      )}

      {/* Lista de categorias sempre visível */}
      <div
        className={
          isFormVisible
            ? "lg:col-span-6 xl:col-span-6"
            : "lg:col-span-12 xl:col-span-12"
        }
      >
        <Card className="border border-border/20 shadow-card">
          <CardHeader className="py-3">
            <CardTitle className="flex items-center gap-2 text-base font-medium text-muted-foreground">
              <FolderTree className="size-4" />
              <span>Categorias Cadastradas</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-4 pt-0">
            <DataVisualization
              title=""
              data={categories}
              columns={columns}
              actions={actions}
              isLoading={isLoading}
              emptyState={
                <div className="py-8 text-center">
                  <Text className="text-muted-foreground">Nenhuma categoria cadastrada</Text>
                  <Text variant="caption" className="text-muted-foreground">
                    Crie sua primeira categoria usando o formulário ao lado
                  </Text>
                </div>
              }
            />
          </CardContent>
        </Card>
      </div>
    </ConfigurationPageLayout>
  );
};

export default Categories;
