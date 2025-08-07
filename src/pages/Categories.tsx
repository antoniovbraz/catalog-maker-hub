import { CategoryForm } from "@/components/forms/CategoryForm";
import { ConfigurationPageLayout, ResponsiveGrid } from "@/components/layout";
import { FolderTree, Plus } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { BaseCard, CardListItem } from "@/components/ui";
import { useFormVisibility } from "@/hooks/useFormVisibility";
import { useCategories, useDeleteCategory } from "@/hooks/useCategories";
import { CategoryType } from "@/types/categories";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

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
            <ResponsiveGrid cols={{ default: 1, sm: 2, lg: 3, xl: 4 }} gap="md">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </ResponsiveGrid>
          ) : categories.length === 0 ? (
            <EmptyState
              icon={<FolderTree className="size-8" />}
              title="Nenhuma categoria cadastrada"
              description="Crie sua primeira categoria para começar"
              action={{
                label: "Nova Categoria",
                onClick: showForm,
                icon: <Plus className="mr-2 size-4" />,
              }}
            />
          ) : (
            <ResponsiveGrid cols={{ default: 1, sm: 2, lg: 3, xl: 4 }} gap="md">
              {categories.map((category) => (
                <CardListItem
                  key={category.id}
                  title={category.name}
                  subtitle={category.description || "Sem descrição"}
                  onEdit={() => handleEdit(category)}
                  onDelete={() => deleteMutation.mutate(category.id)}
                />
              ))}
            </ResponsiveGrid>
          )}
        </BaseCard>
      </div>
    </ConfigurationPageLayout>
  );
};

export default Categories;
