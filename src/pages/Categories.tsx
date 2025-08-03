import { CategoryForm } from "@/components/forms/CategoryForm";
import { ConfigurationPageLayout } from "@/components/layout/ConfigurationPageLayout";
import { FolderTree, Plus } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { useFormVisibility } from "@/hooks/useFormVisibility";
import { CollapsibleCard } from "@/components/ui/collapsible-card";

const Categories = () => {
  const { isFormVisible, isListVisible, showForm, hideForm, toggleList } = useFormVisibility({
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
        <div className="xl:col-span-6">
          <CategoryForm onCancel={hideForm} />
        </div>
      )}

      {/* Lista externa colapsável */}
      <div className={isFormVisible ? "xl:col-span-6" : "xl:col-span-12"}>
        <CollapsibleCard
          title="Categorias Cadastradas"
          icon={<FolderTree className="w-4 h-4" />}
          isOpen={isListVisible}
          onToggle={toggleList}
        >
          <div className="p-4 text-center text-muted-foreground">
            <p>Lista de categorias será exibida aqui</p>
            <p className="text-sm mt-1">Adicione uma nova categoria para começar</p>
          </div>
        </CollapsibleCard>
      </div>
    </ConfigurationPageLayout>
  );
};

export default Categories;
