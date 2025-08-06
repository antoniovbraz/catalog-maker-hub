import { CategoryForm } from "@/components/forms/CategoryForm";
import { ConfigurationPageLayout } from "@/components/layout/ConfigurationPageLayout";
import { FolderTree, Plus } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { BaseCard, CardListItem } from "@/components/ui";
import { useFormVisibility } from "@/hooks/useFormVisibility";
import { useCategories, useDeleteCategory } from "@/hooks/useCategories";
import { CategoryType } from "@/types/categories";
import { useState } from "react";
import { Text } from "@/components/ui/typography";
import { Skeleton } from "@/components/ui/skeleton";

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
        <BaseCard
          className="border border-border/20 shadow-card"
          title={
            <div className="flex items-center gap-2 text-base font-medium text-muted-foreground">
              <FolderTree className="size-4" />
              <span>Categorias Cadastradas</span>
            </div>
          }
          contentPadding="px-6 pb-4 pt-0"
        >
          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="py-8 text-center">
              <Text className="text-muted-foreground">Nenhuma categoria cadastrada</Text>
              <Text variant="caption" className="text-muted-foreground">
                Crie sua primeira categoria usando o formulário ao lado
              </Text>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {categories.map((category) => (
                <CardListItem
                  key={category.id}
                  title={category.name}
                  subtitle={category.description || "Sem descrição"}
                  onEdit={() => handleEdit(category)}
                  onDelete={() => deleteMutation.mutate(category.id)}
                />
              ))}
            </div>
          )}
        </BaseCard>
      </div>
    </ConfigurationPageLayout>
  );
};

export default Categories;
