import { Store, Plus, Eye, EyeOff } from '@/components/ui/icons';
import { ConfigurationPageLayout } from "@/components/layout/ConfigurationPageLayout";
import { Button } from "@/components/ui/button";
import { SimpleMarketplaceForm } from "@/components/forms/enhanced/SimpleMarketplaceForm";
import { MarketplaceHierarchyCard } from "@/components/marketplace/MarketplaceHierarchyCard";
import { useMarketplacesHierarchical, useDeleteMarketplace } from "@/hooks/useMarketplaces";
import { MarketplaceType } from "@/types/marketplaces";
import { useState } from "react";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { useFormVisibility } from "@/hooks/useFormVisibility";
import { CollapsibleCard } from "@/components/ui/collapsible-card";

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
        <Plus className="w-4 h-4 mr-2" />
        Nova Plataforma
      </Button>
    </div>
  );

  return (
    <ConfigurationPageLayout
      title="Gerenciar Marketplaces"
      description="Configure os marketplaces onde seus produtos são vendidos. Organize por modalidades para melhor controle de comissões e regras específicas."
      icon={<Store className="w-6 h-6" />}
      breadcrumbs={breadcrumbs}
      actions={headerActions}
    >
      {/* Form Column */}
      {isFormVisible && (
        <div className="xl:col-span-5 space-y-lg">
          <SimpleMarketplaceForm
            editingMarketplace={editingMarketplace}
            creatingModalityForPlatform={creatingModalityForPlatform}
            onCancel={handleCancelEdit}
          />
        </div>
      )}

      {/* Hierarchy Visualization Column */}
      <div className={isFormVisible ? "xl:col-span-7" : "xl:col-span-12"}>
        <CollapsibleCard
          title="Plataformas e Modalidades"
          icon={<Store className="w-4 h-4" />}
          isOpen={isListVisible}
          onToggle={toggleList}
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-muted-foreground">
                  {totalPlatforms} plataformas, {totalModalities} modalidades
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleList}
                  aria-label={isListVisible ? 'Ocultar lista' : 'Mostrar lista'}
                >
                  {isListVisible ? (
                    <EyeOff className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <Eye className="w-4 h-4" aria-hidden="true" />
                  )}
                </Button>
              </div>
              
              {hierarchicalMarketplaces.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                  <Store className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h4 className="text-base sm:text-lg md:text-xl font-medium mb-2">Nenhuma plataforma cadastrada</h4>
                  <p className="text-muted-foreground mb-4">
                    Comece criando sua primeira plataforma de marketplace
                  </p>
                  <Button onClick={handleCreateNewPlatform}>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Primeira Plataforma
                  </Button>
                </div>
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

