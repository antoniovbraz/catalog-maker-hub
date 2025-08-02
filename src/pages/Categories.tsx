import { Tag, Plus } from "lucide-react";
import { ConfigurationPageLayout } from "@/components/layout";
import { DataVisualization } from "@/components/ui/data-visualization";
import { CategoryFormEnhanced } from "@/components/forms/enhanced/CategoryFormEnhanced";
import { useCategories, useDeleteCategory } from "@/hooks/useCategories";
import { CategoryType } from "@/types/categories";
import { useState } from "react";

const Categories = () => {
  const { data: categories = [], isLoading } = useCategories();
  const deleteMutation = useDeleteCategory();
  const [editingCategory, setEditingCategory] = useState<CategoryType | null>(null);

  const columns = [
    { key: "name", header: "Nome", sortable: true },
    { key: "description", header: "Descrição" }
  ];

  const actions = [
    {
      label: "Editar",
      icon: <Tag className="w-4 h-4" />,
      onClick: (category: CategoryType) => setEditingCategory(category),
      variant: "outline" as const
    }
  ];

  return (
    <ConfigurationPageLayout
      title="Gerenciar Categorias"
      description="Organize seus produtos em categorias"
      icon={<Tag className="w-6 h-6" />}
    >
      <div className="xl:col-span-5">
        <CategoryFormEnhanced
          editingCategory={editingCategory}
          onCancelEdit={() => setEditingCategory(null)}
        />
      </div>
      <div className="xl:col-span-7">
        <DataVisualization
          title="Categorias Cadastradas"
          data={categories}
          columns={columns}
          actions={actions}
          isLoading={isLoading}
        />
      </div>
    </ConfigurationPageLayout>
  );
};

export default Categories;