import { CategoryForm } from "@/components/forms/CategoryForm";
import { ConfigurationPageLayout } from "@/components/layout/ConfigurationPageLayout";
import { FolderTree, Plus } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { useFormVisibility } from "@/hooks/useFormVisibility";

const Categories = () => {
  const { isFormVisible, showForm, hideForm } = useFormVisibility({
    formStorageKey: 'categories-form-visible',
    listStorageKey: 'categories-list-visible'
  });

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
        <div className="xl:col-span-12">
          <CategoryForm />
        </div>
      )}
    </ConfigurationPageLayout>
  );
};

export default Categories;
