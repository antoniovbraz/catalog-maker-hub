import { Plus, Store, Settings, Trash2 } from '@/components/ui/icons';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
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
    <Card className="overflow-hidden">
      <CardHeader className="bg-muted/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Store className="w-5 h-5 text-brand-primary" />
            <div>
              <CardTitle className="text-lg">{platform.name}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  Plataforma
                </Badge>
                <StatusBadge
                  status={isConfigured ? "configured" : "pending"}
                  label={isConfigured ? "Configurada" : "Pendente"}
                  size="sm"
                />
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEditPlatform(platform)}
              aria-label="Editar plataforma"
            >
              <Settings className="w-4 h-4" aria-hidden="true" />
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDeletePlatform(platform.id)}
              aria-label="Excluir plataforma"
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
        
        {platform.description && (
          <p className="text-sm text-muted-foreground mt-2">
            {platform.description}
          </p>
        )}
      </CardHeader>

      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Modalidades</h4>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAddModality(platform.id)}
              className="h-8"
            >
              <Plus className="w-4 h-4 mr-1" />
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
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-muted-foreground text-sm">└</div>
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
                          <p className="text-xs text-muted-foreground mt-1">
                            {modality.description}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditModality(modality)}
                        className="h-8 w-8 p-0"
                        aria-label="Editar modalidade"
                      >
                        <Settings className="w-3 h-3" aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteModality(modality.id)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        aria-label="Excluir modalidade"
                      >
                        <Trash2 className="w-3 h-3" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 border-2 border-dashed border-muted-foreground/25 rounded-lg bg-muted/25">
              <Store className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-3">
                Nenhuma modalidade cadastrada para esta plataforma
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAddModality(platform.id)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Primeira Modalidade
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};