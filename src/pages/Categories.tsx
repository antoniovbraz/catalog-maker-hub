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
          <FolderTree className="w-4 h-4 text-muted-foreground" />
          <span className="font-medium">{item.name}</span>
        </div>
      )
    },
    {
      key: 'description',
      header: 'Descrição',
      className: 'break-words',
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
      icon: <Edit className="w-4 h-4" />,
      onClick: (category: CategoryType) => handleEdit(category)
    },
    {
      label: 'Excluir',
      icon: <Trash2 className="w-4 h-4" />,
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
        <Plus className="w-4 h-4 mr-2" />
        Nova Categoria
      </Button>
    </div>
  );

  return (
    <ConfigurationPageLayout
      title="Gerenciar Categorias"
      description="Organize seus produtos em categorias para melhor gestão"
      icon={<FolderTree className="w-6 h-6" />}
      breadcrumbs={breadcrumbs}
      actions={headerActions}
    >
      {isFormVisible && (
        <div className="xl:col-span-6">
          <CategoryForm onCancel={handleFormCancel} editingCategory={editingCategory} />
        </div>
      )}

      {/* Lista de categorias sempre visível */}
      <div className={isFormVisible ? "xl:col-span-6" : "xl:col-span-12"}>
        <Card className="shadow-card border border-border/20">
          <CardHeader className="py-3">
            <CardTitle className="text-base flex items-center gap-2 font-medium text-muted-foreground">
              <FolderTree className="w-4 h-4" />
              <span>Categorias Cadastradas</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 pb-4 px-6">
            <DataVisualization
              title=""
              data={categories}
              columns={columns}
              actions={actions}
              isLoading={isLoading}
              emptyState={
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Nenhuma categoria cadastrada</p>
                  <p className="text-sm text-muted-foreground">
                    Crie sua primeira categoria usando o formulário ao lado
                  </p>
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
