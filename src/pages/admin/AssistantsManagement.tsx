import { useState } from "react";
import { Plus, Bot, Edit, Trash2 } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { DataVisualization } from "@/components/ui/data-visualization";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { AssistantForm } from "@/components/forms/AssistantForm";
import { ConfigurationPageLayout } from "@/components/layout/ConfigurationPageLayout";
import { useAssistants, useDeleteAssistant } from "@/hooks/useAssistants";
import type { Assistant } from "@/types/assistants";
import type { DataColumn, DataAction } from "@/components/ui/data-visualization";
import { MARKETPLACE_OPTIONS, MODE_OPTIONS } from "@/types/assistants";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AssistantsManagement() {
  const [showForm, setShowForm] = useState(false);
  const [editingAssistant, setEditingAssistant] =
    useState<Assistant | null>(null);
  const [deletingAssistant, setDeletingAssistant] =
    useState<Assistant | null>(null);

  const { data: assistants = [], isLoading } = useAssistants();
  const deleteMutation = useDeleteAssistant();

  const columns: DataColumn<Assistant>[] = [
    {
      key: "name",
      header: "Nome",
      sortable: true,
    },
    {
      key: "marketplace",
      header: "Marketplace",
      sortable: true,
      render: (assistant) => {
        const marketplace = MARKETPLACE_OPTIONS.find(
          (m) => m.value === assistant.marketplace,
        );
        return marketplace?.label || assistant.marketplace;
      },
    },
    {
      key: "mode",
      header: "Modo",
      sortable: true,
      render: (assistant) => {
        const mode = MODE_OPTIONS.find((m) => m.value === assistant.mode);
        return mode?.label || assistant.mode;
      },
    },
    {
      key: "model",
      header: "Modelo",
      sortable: true,
    },
    {
      key: "created_at",
      header: "Criado em",
      sortable: true,
      render: (assistant) =>
        format(new Date(assistant.created_at), "dd/MM/yyyy 'às' HH:mm", {
          locale: ptBR,
        }),
    },
  ];

  const actions: DataAction<Assistant>[] = [
    {
      label: "Editar",
      icon: <Edit className="size-4" />,
      onClick: (assistant) => {
        setEditingAssistant(assistant);
        setShowForm(true);
      },
      variant: "secondary",
    },
    {
      label: "Excluir",
      icon: <Trash2 className="size-4" />,
      onClick: (assistant) => setDeletingAssistant(assistant),
      variant: "destructive",
    },
  ];

  const handleCreateNew = () => {
    setEditingAssistant(null);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setEditingAssistant(null);
  };

  const handleConfirmDelete = async () => {
    if (deletingAssistant) {
      await deleteMutation.mutateAsync(deletingAssistant.id);
      setDeletingAssistant(null);
    }
  };

  const breadcrumbs = [
    { label: "Admin", href: "/admin" },
    { label: "Assistentes IA" },
  ];

  const headerActions = (
    <Button size="sm" onClick={handleCreateNew} className="gap-sm">
      <Plus className="size-4" />
      Novo Assistente
    </Button>
  );

  return (
    <>
      <ConfigurationPageLayout
        title="Assistentes IA"
        description="Gerencie os assistentes IA para cada marketplace"
        icon={<Bot className="size-6" />}
        breadcrumbs={breadcrumbs}
        actions={headerActions}
      >
        <div className="w-full max-w-5xl lg:col-span-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-sm">
                <Bot className="size-5" />
                Assistentes Configurados
              </CardTitle>
              <CardDescription>
                Lista de todos os assistentes IA configurados para os marketplaces.
                Cada marketplace pode ter apenas um assistente ativo por vez.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataVisualization
                title="Assistentes IA"
                data={assistants}
                columns={columns}
                actions={actions}
                searchable
                isLoading={isLoading}
                emptyState={
                  <EmptyState
                    icon={<Bot className="size-8" />}
                    title="Nenhum assistente configurado ainda"
                    description="Crie seu primeiro assistente IA para começar a gerar anúncios automaticamente"
                    action={{
                      label: "Criar Assistente",
                      onClick: handleCreateNew,
                      icon: <Plus className="mr-2 size-4" />,
                    }}
                  />
                }
              />
            </CardContent>
          </Card>
        </div>
      </ConfigurationPageLayout>

      {/* Modal de criação/edição */}
      <AssistantForm
        open={showForm}
        onOpenChange={setShowForm}
        assistant={editingAssistant}
        onSuccess={handleFormSuccess}
      />

      {/* Dialog de confirmação de exclusão */}
      <ConfirmDialog
        open={!!deletingAssistant}
        onOpenChange={(open) => !open && setDeletingAssistant(null)}
        title="Excluir Assistente"
        description={`Tem certeza que deseja excluir o assistente "${deletingAssistant?.name}"? Esta ação não pode ser desfeita e o assistente será removido da OpenAI também.`}
        confirmText="Excluir"
        onConfirm={handleConfirmDelete}
        loading={deleteMutation.isPending}
        variant="destructive"
      />
    </>
  );
}

