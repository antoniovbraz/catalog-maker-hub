import { useState } from "react";
import { Plus, Bot, Edit, Trash2 } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataVisualization } from "@/components/ui/data-visualization";
import { AssistantModalForm } from "@/components/forms/AssistantModalForm";
import { useGlobalModal } from "@/hooks/useGlobalModal";
import { useAssistants, useDeleteAssistant } from "@/hooks/useAssistants";
import type { Assistant } from "@/types/assistants";
import type { DataColumn, DataAction } from "@/components/ui/data-visualization";
import { MARKETPLACE_OPTIONS } from "@/types/assistants";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AssistantsManagement() {
  const { data: assistants = [], isLoading } = useAssistants();
  const deleteMutation = useDeleteAssistant();
  const { showFormModal, showConfirmModal } = useGlobalModal();

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
        const marketplace = MARKETPLACE_OPTIONS.find(m => m.value === assistant.marketplace);
        return marketplace?.label || assistant.marketplace;
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
        format(new Date(assistant.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }),
    },
  ];

  const actions: DataAction<Assistant>[] = [
    {
      label: "Editar",
      icon: <Edit className="size-4" />,
      onClick: (assistant) => handleEdit(assistant),
      variant: "secondary",
    },
    {
      label: "Excluir",
      icon: <Trash2 className="size-4" />,
      onClick: (assistant) => handleDelete(assistant),
      variant: "destructive",
    },
  ];

  const handleCreateNew = () => {
    let submitForm: (() => Promise<void>) | null = null;
    
    showFormModal({
      title: "Novo Assistente IA",
      description: "Configure um novo assistente para um marketplace específico",
      content: (
        <AssistantModalForm 
          onSuccess={() => {}} 
          onSubmitForm={(fn) => { submitForm = fn; }}
        />
      ),
      onSave: async () => {
        if (submitForm) await submitForm();
      },
      size: "lg"
    });
  };

  const handleEdit = (assistant: Assistant) => {
    let submitForm: (() => Promise<void>) | null = null;
    
    showFormModal({
      title: "Editar Assistente IA",
      description: "Modifique as configurações do assistente",
      content: (
        <AssistantModalForm 
          assistant={assistant}
          onSuccess={() => {}} 
          onSubmitForm={(fn) => { submitForm = fn; }}
        />
      ),
      onSave: async () => {
        if (submitForm) await submitForm();
      },
      size: "lg"
    });
  };

  const handleDelete = (assistant: Assistant) => {
    showConfirmModal({
      title: "Excluir Assistente",
      description: `Tem certeza que deseja excluir o assistente "${assistant.name}"? Esta ação não pode ser desfeita e o assistente será removido da OpenAI também.`,
      onConfirm: async () => {
        await deleteMutation.mutateAsync(assistant.id);
      },
      confirmText: "Excluir",
      variant: "destructive"
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Assistentes IA</h1>
          <p className="mt-2 text-muted-foreground">
            Gerencie os assistentes IA para cada marketplace
          </p>
        </div>
        <Button onClick={handleCreateNew} className="gap-2">
          <Plus className="size-4" />
          Novo Assistente
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
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
              <div className="py-8 text-center">
                <p className="text-muted-foreground">Nenhum assistente configurado ainda</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Crie seu primeiro assistente IA para começar a gerar anúncios automaticamente
                </p>
              </div>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}