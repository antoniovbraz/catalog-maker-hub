import { ConfigurationPageLayout } from "@/components/layout/ConfigurationPageLayout";
import { FolderTree, Plus, Edit, Trash2 } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCategories, useDeleteCategory } from "@/hooks/useCategories";
import { CategoryType } from "@/types/categories";
import { DataVisualization } from "@/components/ui/data-visualization";
import { CategoryModalForm } from "@/components/forms/CategoryModalForm";
import { useGlobalModal } from "@/hooks/useGlobalModal";

const Categories = () => {
  const { data: categories = [], isLoading } = useCategories();
  const deleteMutation = useDeleteCategory();
  const { showFormModal, showConfirmModal } = useGlobalModal();

  const handleCreateNew = () => {
    let submitForm: (() => Promise<void>) | null = null;
    
    showFormModal({
      title: "Nova Categoria",
      description: "Crie uma nova categoria para organizar seus produtos",
      content: (
        <CategoryModalForm 
          onSuccess={() => {}} 
          onSubmitForm={(fn) => { submitForm = fn; }}
        />
      ),
      onSave: async () => {
        if (submitForm) await submitForm();
      },
      size: "md"
    });
  };

  const handleEdit = (category: CategoryType) => {
    let submitForm: (() => Promise<void>) | null = null;
    
    showFormModal({
      title: "Editar Categoria",
      description: "Modifique as informações da categoria",
      content: (
        <CategoryModalForm 
          category={category}
          onSuccess={() => {}} 
          onSubmitForm={(fn) => { submitForm = fn; }}
        />
      ),
      onSave: async () => {
        if (submitForm) await submitForm();
      },
      size: "md"
    });
  };

  const handleDelete = (category: CategoryType) => {
    showConfirmModal({
      title: "Excluir Categoria",
      description: `Tem certeza que deseja excluir a categoria "${category.name}"? Esta ação não pode ser desfeita.`,
      onConfirm: async () => {
        await deleteMutation.mutateAsync(category.id);
      },
      confirmText: "Excluir",
      variant: "destructive"
    });
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
      onClick: (category: CategoryType) => handleDelete(category),
      variant: 'destructive' as const
    }
  ];

  const breadcrumbs = [
    { label: "Configurações", href: "/dashboard" },
    { label: "Categorias" }
  ];

  const headerActions = (
    <div className="flex items-center gap-2">
      <Button size="sm" onClick={handleCreateNew}>
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
      <div className="xl:col-span-12">
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
                  <p className="text-muted-foreground">Nenhuma categoria cadastrada</p>
                  <p className="text-sm text-muted-foreground">
                    Clique em "Nova Categoria" para criar sua primeira categoria
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
