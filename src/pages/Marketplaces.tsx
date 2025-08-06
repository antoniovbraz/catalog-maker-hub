import { Store, Plus, Eye, EyeOff } from '@/components/ui/icons';
import { ConfigurationPageLayout } from "@/components/layout/ConfigurationPageLayout";
import { Button } from "@/components/ui/button";
import { SimpleMarketplaceForm } from "@/components/forms/enhanced/SimpleMarketplaceForm";
import { MarketplaceHierarchyCard } from "@/components/marketplace/MarketplaceHierarchyCard";
import { useMarketplacesHierarchical, useDeleteMarketplace } from "@/hooks/useMarketplaces";
import { MarketplaceType } from "@/types/marketplaces";
import { useState } from "react";
import { useFormVisibility } from "@/hooks/useFormVisibility";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

const Marketplaces = () => {
  const { data: hierarchicalMarketplaces = [], isLoading } = useMarketplacesHierarchical();
  const deleteMutation = useDeleteMarketplace();
  const [editingMarketplace, setEditingMarketplace] = useState<MarketplaceType | null>(null);
  const [creatingModalityForPlatform, setCreatingModalityForPlatform] = useState<string | null>(null);
  
  const { isFormVisible, isListVisible, showForm, hideForm, toggleList } = useFormVisibility({
    formStorageKey: 'marketplaces-form-visible',
    listStorageKey: 'marketplaces-list-visible'
  });

  // Calculate stats from hierarchical data
  const totalPlatforms = hierarchicalMarketplaces.length;
  const totalModalities = hierarchicalMarketplaces.reduce((acc, h) => acc + h.children.length, 0);

  const handleEditPlatform = (platform: MarketplaceType) => {
    setEditingMarketplace(platform);
    setCreatingModalityForPlatform(null);
    showForm();
  };

  const handleEditModality = (modality: MarketplaceType) => {
    setEditingMarketplace(modality);
    setCreatingModalityForPlatform(null);
    showForm();
  };

  const handleAddModality = (platformId: string) => {
    setEditingMarketplace(null);
    setCreatingModalityForPlatform(platformId);
    showForm();
  };

  const handleCreateNewPlatform = () => {
    setEditingMarketplace(null);
    setCreatingModalityForPlatform(null);
    showForm();
  };

  const handleCancelEdit = () => {
    setEditingMarketplace(null);
    setCreatingModalityForPlatform(null);
    hideForm();
  };

  const handleDeletePlatform = (platformId: string) => {
    deleteMutation.mutate(platformId);
  };

  const handleDeleteModality = (modalityId: string) => {
    deleteMutation.mutate(modalityId);
  };

  const breadcrumbs = [
    { label: "Configurações", href: "/dashboard" },
    { label: "Marketplaces" }
  ];

  const headerActions = (
    <div className="flex items-center gap-2">
      <Button size="sm" onClick={handleCreateNewPlatform}>
        <Plus className="mr-2 size-4" />
        Nova Plataforma
      </Button>
    </div>
  );

  return (
    <ConfigurationPageLayout
      title="Gerenciar Marketplaces"
      description="Configure os marketplaces onde seus produtos são vendidos. Organize por modalidades para melhor controle de comissões e regras específicas."
      icon={<Store className="size-6" />}
      breadcrumbs={breadcrumbs}
      actions={headerActions}
    >
      {/* Form Column */}
      {isFormVisible && (
        <div className="space-y-lg lg:col-span-5 xl:col-span-5">
          <SimpleMarketplaceForm
            editingMarketplace={editingMarketplace}
            creatingModalityForPlatform={creatingModalityForPlatform}
            onCancel={handleCancelEdit}
          />
        </div>
      )}

      {/* Hierarchy Visualization Column */}
      <div
        className={
          isFormVisible
            ? "lg:col-span-7 xl:col-span-7"
            : "lg:col-span-12 xl:col-span-12"
        }
      >
        <CollapsibleCard
          title="Plataformas e Modalidades"
          icon={<Store className="size-4" />}
          isOpen={isListVisible}
          onToggle={toggleList}
        >
          {isLoading ? (
            <div className="space-y-4 py-12">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {totalPlatforms} plataformas, {totalModalities} modalidades
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleList}
                >
                  {isListVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </Button>
              </div>

              {hierarchicalMarketplaces.length === 0 ? (
                <EmptyState
                  icon={<Store className="size-8" />}
                  title="Nenhuma plataforma cadastrada"
                  description="Comece criando sua primeira plataforma de marketplace"
                  action={{
                    label: "Criar Primeira Plataforma",
                    onClick: handleCreateNewPlatform,
                    icon: <Plus className="mr-2 size-4" />,
                  }}
                />
              ) : (
                <div className="space-y-4">
                  {hierarchicalMarketplaces.map((hierarchy) => (
                    <MarketplaceHierarchyCard
                      key={hierarchy.parent.id}
                      hierarchy={hierarchy}
                      onEditPlatform={handleEditPlatform}
                      onEditModality={handleEditModality}
                      onAddModality={handleAddModality}
                      onDeletePlatform={handleDeletePlatform}
                      onDeleteModality={handleDeleteModality}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </CollapsibleCard>
      </div>
    </ConfigurationPageLayout>
  );
};

export default Marketplaces;

