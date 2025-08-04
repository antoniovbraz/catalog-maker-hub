import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Check } from "@/components/ui/icons";
import { useMarketplacePlatforms, useCreateMarketplace, useUpdateMarketplace } from "@/hooks/useMarketplaces";
import { useCategories } from "@/hooks/useCategories";
import { MarketplaceType, MarketplaceFormData } from "@/types/marketplaces";
import { cn } from "@/lib/utils";

interface SimpleMarketplaceFormProps {
  editingMarketplace?: MarketplaceType | null;
  creatingModalityForPlatform?: string | null;
  onCancel?: () => void;
}

export function SimpleMarketplaceForm({ 
  editingMarketplace, 
  creatingModalityForPlatform,
  onCancel
}: SimpleMarketplaceFormProps) {
  const [formData, setFormData] = useState<MarketplaceFormData>({
    name: "",
    description: "",
    url: "",
    platform_id: null,
    marketplace_type: "modality",
    category_restrictions: [],
  });

  const [isDirty, setIsDirty] = useState(false);
  const [showOptional, setShowOptional] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [allCategoriesSelected, setAllCategoriesSelected] = useState(true);

  const { data: platforms = [] } = useMarketplacePlatforms();
  const { data: categories = [] } = useCategories();
  const createMutation = useCreateMarketplace();
  const updateMutation = useUpdateMarketplace();

  const isEditing = !!editingMarketplace;
  const isCreatingModality = !!creatingModalityForPlatform;
  const isCreatingPlatform = !isEditing && !isCreatingModality;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  // Inferir tipo baseado no contexto
  const inferredType = isCreatingModality ? "modality" : isCreatingPlatform ? "platform" : editingMarketplace?.marketplace_type || "platform";

  useEffect(() => {
    if (editingMarketplace) {
      const restrictions = Array.isArray(editingMarketplace.category_restrictions) 
        ? editingMarketplace.category_restrictions as string[]
        : [];
      
      setFormData({
        name: editingMarketplace.name,
        description: editingMarketplace.description || "",
        url: editingMarketplace.url || "",
        platform_id: editingMarketplace.platform_id,
        marketplace_type: editingMarketplace.marketplace_type,
        category_restrictions: restrictions,
      });
      setSelectedCategories(restrictions);
      setAllCategoriesSelected(restrictions.length === 0);
      setShowOptional(!!editingMarketplace.description || !!editingMarketplace.url || restrictions.length > 0);
    } else if (creatingModalityForPlatform) {
      setFormData({
        name: "",
        description: "",
        url: "",
        platform_id: creatingModalityForPlatform,
        marketplace_type: "modality",
        category_restrictions: [],
      });
      setSelectedCategories([]);
      setAllCategoriesSelected(true);
    } else {
      setFormData({
        name: "",
        description: "",
        url: "",
        platform_id: null,
        marketplace_type: "platform",
        category_restrictions: [],
      });
      setSelectedCategories([]);
      setAllCategoriesSelected(true);
    }
    setIsDirty(false);
  }, [editingMarketplace, creatingModalityForPlatform]);

  const handleInputChange = (field: keyof MarketplaceFormData, value: string | null | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const toggleCategory = (categoryId: string) => {
    if (allCategoriesSelected) {
      setAllCategoriesSelected(false);
      setSelectedCategories([categoryId]);
    } else {
      const newSelected = selectedCategories.includes(categoryId)
        ? selectedCategories.filter(id => id !== categoryId)
        : [...selectedCategories, categoryId];
      
      if (newSelected.length === 0) {
        setAllCategoriesSelected(true);
      }
      setSelectedCategories(newSelected);
    }
    
    const finalRestrictions = allCategoriesSelected || selectedCategories.length === 0 ? [] : selectedCategories;
    handleInputChange("category_restrictions", finalRestrictions);
    setIsDirty(true);
  };

  const toggleAllCategories = () => {
    setAllCategoriesSelected(!allCategoriesSelected);
    if (!allCategoriesSelected) {
      setSelectedCategories([]);
      handleInputChange("category_restrictions", []);
    }
    setIsDirty(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      marketplace_type: inferredType,
      platform_id: inferredType === "platform" ? null : formData.platform_id,
      category_restrictions: allCategoriesSelected ? [] : selectedCategories,
      description: formData.description || null,
      url: formData.url || null,
    };
    
    if (isEditing && editingMarketplace) {
      updateMutation.mutate({ id: editingMarketplace.id, data: submitData }, {
        onSuccess: () => {
          setIsDirty(false);
          onCancel?.();
        }
      });
    } else {
      createMutation.mutate(submitData, {
        onSuccess: () => {
          setFormData({
            name: "",
            description: "",
            url: "",
            platform_id: creatingModalityForPlatform || null,
            marketplace_type: inferredType,
            category_restrictions: [],
          });
          setSelectedCategories([]);
          setAllCategoriesSelected(true);
          setIsDirty(false);
          onCancel?.();
        }
      });
    }
  };

  const getTitle = () => {
    if (isEditing) return `Editar ${inferredType === 'platform' ? 'Plataforma' : 'Modalidade'}`;
    if (isCreatingModality) return 'Nova Modalidade';
    return 'Nova Plataforma';
  };

  const getDescription = () => {
    if (isEditing) return `Edite as informações desta ${inferredType === 'platform' ? 'plataforma' : 'modalidade'}`;
    if (isCreatingModality) return 'Crie uma nova modalidade para esta plataforma';
    return 'Crie uma nova plataforma de marketplace';
  };

  const platformName = platforms.find(p => p.id === creatingModalityForPlatform)?.name;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="pb-md">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-sm">
              {getTitle()}
              {isEditing ? (
                <Badge variant="outline">Editando</Badge>
              ) : (
                <Badge variant="default">{isCreatingModality ? 'Nova' : 'Nova'}</Badge>
              )}
            </CardTitle>
            <CardDescription className="mt-xs">
              {getDescription()}
              {isCreatingModality && platformName && (
                <span className="block mt-xs text-primary font-medium">
                  Para a plataforma: {platformName}
                </span>
              )}
            </CardDescription>
          </div>
          {isDirty && (
            <Badge variant="destructive" className="text-xs">
              Alterações não salvas
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-lg">
          {/* Campos principais */}
          <div className="space-y-md">
            <div>
              <Label htmlFor="name" className="text-sm font-medium">
                Nome * 
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder={inferredType === 'platform' ? "Ex: Mercado Livre, Shopee" : "Ex: ML Clássico, Shopee Frete Grátis"}
                required
                className="mt-xs"
              />
            </div>
          </div>

          {/* Campos opcionais colapsáveis */}
          <div className="space-y-md">
            <div className="flex items-center gap-sm">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowOptional(!showOptional)}
                className="text-sm text-muted-foreground hover:text-primary p-0 h-auto"
              >
                <Plus className={cn("w-3 h-3 mr-1 transition-transform", showOptional && "rotate-45")} />
                Opções avançadas
              </Button>
            </div>

            {showOptional && (
              <div className="space-y-md p-md bg-muted/30 rounded-md border border-dashed">
                <div>
                  <Label htmlFor="description" className="text-sm">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Descreva as características..."
                    rows={3}
                    className="mt-xs"
                  />
                </div>

                {inferredType === "platform" && (
                  <div>
                    <Label htmlFor="url" className="text-sm">URL do Site</Label>
                    <Input
                      id="url"
                      type="url"
                      value={formData.url}
                      onChange={(e) => handleInputChange("url", e.target.value)}
                      placeholder="https://exemplo.com.br"
                      className="mt-xs"
                    />
                  </div>
                )}

                {/* Seletor de categorias intuitivo - apenas para modalidades */}
                {inferredType === "modality" && categories.length > 0 && (
                  <div>
                    <Label className="text-sm">Categorias Permitidas</Label>
                    <div className="mt-xs space-y-sm">
                      <div className="flex items-center gap-sm">
                        <Button
                          type="button"
                          variant={allCategoriesSelected ? "default" : "outline"}
                          size="sm"
                          onClick={toggleAllCategories}
                          className="h-8"
                        >
                          {allCategoriesSelected && <Check className="w-3 h-3 mr-1" />}
                          Todas as categorias
                        </Button>
                        {!allCategoriesSelected && (
                          <span className="text-xs text-muted-foreground">
                            {selectedCategories.length} categoria(s) selecionada(s)
                          </span>
                        )}
                      </div>
                      
                      {!allCategoriesSelected && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-xs max-h-32 overflow-y-auto">
                          {categories.map((category) => {
                            const isSelected = selectedCategories.includes(category.id);
                            return (
                              <Button
                                key={category.id}
                                type="button"
                                variant={isSelected ? "default" : "outline"}
                                size="sm"
                                onClick={() => toggleCategory(category.id)}
                                className="h-8 justify-start text-xs"
                              >
                                {isSelected && <Check className="w-3 h-3 mr-1" />}
                                {category.name}
                              </Button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-xs">
                      Por padrão, todas as categorias podem usar esta modalidade
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Botões de ação */}
          <div className="flex justify-end gap-sm pt-md border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={!formData.name.trim() || isSubmitting}
              className="min-w-[120px]"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-sm">
                  <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                  {isEditing ? 'Salvando...' : 'Criando...'}
                </div>
              ) : (
                isEditing ? 'Salvar' : (isCreatingModality ? 'Criar Modalidade' : 'Criar Plataforma')
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}