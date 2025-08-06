import { Plus, Store, Settings, Trash2 } from '@/components/ui/icons';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { BaseCard } from "@/components/ui";
import { CardTitle } from "@/components/ui/card";
import { MarketplaceHierarchy, MarketplaceType } from "@/types/marketplaces";

interface MarketplaceHierarchyCardProps {
  hierarchy: MarketplaceHierarchy;
  onEditPlatform: (platform: MarketplaceType) => void;
  onEditModality: (modality: MarketplaceType) => void;
  onAddModality: (platformId: string) => void;
  onDeletePlatform: (platformId: string) => void;
  onDeleteModality: (modalityId: string) => void;
}

export const MarketplaceHierarchyCard = ({
  hierarchy,
  onEditPlatform,
  onEditModality,
  onAddModality,
  onDeletePlatform,
  onDeleteModality
}: MarketplaceHierarchyCardProps) => {
  const { parent: platform, children: modalities } = hierarchy;
  const hasModalities = modalities.length > 0;
  const isConfigured = platform.url && platform.description;

  return (
    <BaseCard
      className="overflow-hidden [&>div:first-child]:bg-muted/50"
      icon={<Store className="size-5 text-primary" />}
      title={
        <div>
          <CardTitle className="text-lg">{platform.name}</CardTitle>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              Plataforma
            </Badge>
            <StatusBadge
              status={isConfigured ? "configured" : "pending"}
              label={isConfigured ? "Configurada" : "Pendente"}
              size="sm"
            />
          </div>
          {platform.description && (
            <p className="mt-2 text-sm text-muted-foreground">
              {platform.description}
            </p>
          )}
        </div>
      }
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEditPlatform(platform)}
          >
            <Settings className="size-4" />
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDeletePlatform(platform.id)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      }
      contentSpacing="space-y-0"
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">Modalidades</h4>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onAddModality(platform.id)}
            className="h-8"
          >
            <Plus className="mr-1 size-4" />
            Nova Modalidade
          </Button>
        </div>

        {hasModalities ? (
          <div className="space-y-2">
            {modalities.map((modality) => {
              const modalityConfigured = modality.url && modality.description;
              return (
                <div
                  key={modality.id}
                  className="flex items-center justify-between rounded-lg border bg-card p-3 transition-colors hover:bg-accent/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-muted-foreground">└</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{modality.name}</span>
                        <StatusBadge
                          status={modalityConfigured ? "configured" : "pending"}
                          label={modalityConfigured ? "Configurada" : "Pendente"}
                          size="sm"
                        />
                      </div>
                      {modality.description && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {modality.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditModality(modality)}
                      className="size-8 p-0"
                    >
                      <Settings className="size-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteModality(modality.id)}
                      className="size-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/25 py-6 text-center">
            <Store className="mx-auto mb-2 size-8 text-muted-foreground" />
            <p className="mb-3 text-sm text-muted-foreground">
              Nenhuma modalidade cadastrada para esta plataforma
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAddModality(platform.id)}
            >
              <Plus className="mr-2 size-4" />
              Adicionar Primeira Modalidade
            </Button>
          </div>
        )}
      </div>
    </BaseCard>
  );
};