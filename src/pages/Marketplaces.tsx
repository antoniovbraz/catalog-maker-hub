import { Store, Plus, Eye, EyeOff, ExternalLink } from '@/components/ui/icons';
import { ConfigurationPageLayout } from "@/components/layout/ConfigurationPageLayout";
import { Button } from "@/components/ui/button";
import { MarketplaceHierarchyCard } from "@/components/marketplace/MarketplaceHierarchyCard";
import { useMarketplacesHierarchical, useDeleteMarketplace } from "@/hooks/useMarketplaces";
import { MarketplaceType } from "@/types/marketplaces";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { MarketplaceModalForm } from "@/components/forms/MarketplaceModalForm";
import { useGlobalModal } from "@/hooks/useGlobalModal";
import { useCollapsibleSection } from "@/hooks/useCollapsibleSection";
import { MLConnectionCard } from "@/components/ml/MLConnectionCard";
import { Link } from "react-router-dom";

const Marketplaces = () => {
  const { data: hierarchicalMarketplaces = [], isLoading } = useMarketplacesHierarchical();
  const deleteMutation = useDeleteMarketplace();
  const { showFormModal, showConfirmModal } = useGlobalModal();
  const { isOpen: isListVisible, toggle: toggleList } = useCollapsibleSection({
    storageKey: 'marketplaces-list-visible',
    defaultOpen: true,
  });

  // Calculate stats from hierarchical data
  const totalPlatforms = hierarchicalMarketplaces.length;
  const totalModalities = hierarchicalMarketplaces.reduce(
    (acc, h) => acc + h.children.length,
    0
  );

  const openPlatformForm = (platform?: MarketplaceType) => {
    let submitForm: (() => Promise<void>) | null = null;

    showFormModal({
      title: platform ? "Editar Plataforma" : "Nova Plataforma",
      description: platform
        ? "Edite as informações da plataforma"
        : "Crie uma nova plataforma de marketplace",
      content: (
        <MarketplaceModalForm
          marketplace={platform}
          onSuccess={() => {}}
          onSubmitForm={(fn) => {
            submitForm = fn;
          }}
        />
      ),
      onSave: async () => {
        if (submitForm) await submitForm();
      },
      size: "lg",
    });
  };

  const openModalityForm = (options: {
    modality?: MarketplaceType;
    platformId?: string;
  }) => {
    let submitForm: (() => Promise<void>) | null = null;

    showFormModal({
      title: options.modality ? "Editar Modalidade" : "Nova Modalidade",
      description: options.modality
        ? "Modifique as informações da modalidade"
        : "Crie uma nova modalidade para esta plataforma",
      content: (
        <MarketplaceModalForm
          marketplace={options.modality}
          platformId={options.platformId}
          onSuccess={() => {}}
          onSubmitForm={(fn) => {
            submitForm = fn;
          }}
        />
      ),
      onSave: async () => {
        if (submitForm) await submitForm();
      },
      size: "lg",
    });
  };

  const handleEditPlatform = (platform: MarketplaceType) => {
    openPlatformForm(platform);
  };

  const handleEditModality = (modality: MarketplaceType) => {
    openModalityForm({ modality });
  };

  const handleAddModality = (platformId: string) => {
    openModalityForm({ platformId });
  };

  const handleCreateNewPlatform = () => {
    openPlatformForm();
  };

  const handleDeletePlatform = (platformId: string) => {
    showConfirmModal({
      title: "Excluir Plataforma",
      description:
        "Tem certeza que deseja excluir esta plataforma? Esta ação não pode ser desfeita.",
      onConfirm: async () => {
        await deleteMutation.mutateAsync(platformId);
      },
      confirmText: "Excluir",
      variant: "destructive",
    });
  };

  const handleDeleteModality = (modalityId: string) => {
    showConfirmModal({
      title: "Excluir Modalidade",
      description:
        "Tem certeza que deseja excluir esta modalidade? Esta ação não pode ser desfeita.",
      onConfirm: async () => {
        await deleteMutation.mutateAsync(modalityId);
      },
      confirmText: "Excluir",
      variant: "destructive",
    });
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
      {/* ML Integration Section */}
      <div className="mb-6 xl:col-span-12">
        <div className="rounded-lg border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Integração Mercado Livre</h3>
              <p className="text-sm text-muted-foreground">
                Conecte sua conta para sincronizar produtos automaticamente
              </p>
            </div>
            <Link to="/integrations/mercado-livre">
              <Button variant="outline">
                <ExternalLink className="mr-2 size-4" />
                Gerenciar Integração
              </Button>
            </Link>
          </div>
          <MLConnectionCard />
        </div>
      </div>

      <div className="xl:col-span-12">
        <CollapsibleCard
          title="Plataformas e Modalidades"
          icon={<Store className="size-4" />}
          isOpen={isListVisible}
          onToggle={toggleList}
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
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
                <div className="rounded-lg border-2 border-dashed border-muted-foreground/25 py-12 text-center">
                  <Store className="mx-auto mb-4 size-12 text-muted-foreground" />
                  <h4 className="mb-2 text-lg font-medium">Nenhuma plataforma cadastrada</h4>
                  <p className="mb-4 text-muted-foreground">
                    Comece criando sua primeira plataforma de marketplace
                  </p>
                  <Button onClick={handleCreateNewPlatform}>
                    <Plus className="mr-2 size-4" />
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

