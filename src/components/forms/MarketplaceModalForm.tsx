import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Check } from "@/components/ui/icons";
import { useCreateMarketplace, useUpdateMarketplace } from "@/hooks/useMarketplaces";
import { useCategories } from "@/hooks/useCategories";
import { MarketplaceType, MarketplaceFormData } from "@/types/marketplaces";
import { cn } from "@/lib/utils";

interface MarketplaceModalFormProps {
  marketplace?: MarketplaceType;
  platformId?: string | null;
  onSuccess: () => void;
  onSubmitForm: (submitFn: () => Promise<void>) => void;
}

export function MarketplaceModalForm({
  marketplace,
  platformId = null,
  onSuccess,
  onSubmitForm,
}: MarketplaceModalFormProps) {
  const [formData, setFormData] = useState<MarketplaceFormData>({
    name: "",
    description: "",
    url: "",
    platform_id: platformId,
    marketplace_type: platformId ? "modality" : "platform",
    category_restrictions: [],
  });
  const [showOptional, setShowOptional] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [allCategoriesSelected, setAllCategoriesSelected] = useState(true);

  const { data: categories = [] } = useCategories();
  const createMutation = useCreateMarketplace();
  const updateMutation = useUpdateMarketplace();

  const isEditing = !!marketplace;
  const inferredType = platformId
    ? "modality"
    : isEditing
    ? marketplace!.marketplace_type
    : "platform";

  useEffect(() => {
    if (marketplace) {
      const restrictions = Array.isArray(marketplace.category_restrictions)
        ? (marketplace.category_restrictions as string[])
        : [];
      setFormData({
        name: marketplace.name,
        description: marketplace.description || "",
        url: marketplace.url || "",
        platform_id: marketplace.platform_id || null,
        marketplace_type: marketplace.marketplace_type,
        category_restrictions: restrictions,
      });
      setSelectedCategories(restrictions);
      setAllCategoriesSelected(restrictions.length === 0);
      setShowOptional(
        !!marketplace.description ||
          !!marketplace.url ||
          restrictions.length > 0
      );
    } else {
      setFormData({
        name: "",
        description: "",
        url: "",
        platform_id: platformId,
        marketplace_type: platformId ? "modality" : "platform",
        category_restrictions: [],
      });
      setSelectedCategories([]);
      setAllCategoriesSelected(true);
      setShowOptional(false);
    }
  }, [marketplace, platformId]);

  const handleInputChange = (
    field: keyof MarketplaceFormData,
    value: string | null | string[]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleCategory = (categoryId: string) => {
    if (allCategoriesSelected) {
      setAllCategoriesSelected(false);
      setSelectedCategories([categoryId]);
      handleInputChange("category_restrictions", [categoryId]);
    } else {
      const newSelected = selectedCategories.includes(categoryId)
        ? selectedCategories.filter((id) => id !== categoryId)
        : [...selectedCategories, categoryId];
      setSelectedCategories(newSelected);
      if (newSelected.length === 0) {
        setAllCategoriesSelected(true);
        handleInputChange("category_restrictions", []);
      } else {
        handleInputChange("category_restrictions", newSelected);
      }
    }
  };

  const toggleAllCategories = () => {
    const newAll = !allCategoriesSelected;
    setAllCategoriesSelected(newAll);
    if (newAll) {
      setSelectedCategories([]);
      handleInputChange("category_restrictions", []);
    }
  };

  const handleSubmit = useCallback(async () => {
    const submitData: MarketplaceFormData = {
      ...formData,
      marketplace_type: inferredType,
      platform_id: inferredType === "platform" ? null : formData.platform_id,
      category_restrictions: allCategoriesSelected ? [] : selectedCategories,
      description: formData.description || null,
      url: formData.url || null,
    };
    try {
      if (isEditing && marketplace) {
        await updateMutation.mutateAsync({ id: marketplace.id, data: submitData });
      } else {
        await createMutation.mutateAsync(submitData);
      }
      onSuccess();
    } catch (error) {
      // errors handled by hooks
    }
  }, [
    formData,
    inferredType,
    allCategoriesSelected,
    selectedCategories,
    isEditing,
    marketplace,
    createMutation,
    updateMutation,
    onSuccess,
  ]);

  useEffect(() => {
    onSubmitForm(handleSubmit);
  }, [handleSubmit, onSubmitForm]);

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-lg">
      <div className="space-y-md">
        <div>
          <Label htmlFor="name" className="text-sm font-medium">
            Nome *
          </Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange("name", e.target.value)}
            placeholder={
              inferredType === "platform"
                ? "Ex: Mercado Livre, Shopee"
                : "Ex: ML Clássico, Shopee Frete Grátis"
            }
            required
            className="mt-xs"
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="space-y-md">
        <div className="flex items-center gap-sm">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowOptional(!showOptional)}
            className="h-auto p-0 text-sm text-muted-foreground hover:text-primary"
          >
            <Plus
              className={cn(
                "w-3 h-3 mr-1 transition-transform",
                showOptional && "rotate-45"
              )}
            />
            Opções avançadas
          </Button>
        </div>

        {showOptional && (
          <div className="space-y-md rounded-md border border-dashed bg-muted/30 p-md">
            <div>
              <Label htmlFor="description" className="text-sm">
                Descrição
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Descreva as características..."
                rows={3}
                className="mt-xs"
                disabled={isLoading}
              />
            </div>

            {inferredType === "platform" && (
              <div>
                <Label htmlFor="url" className="text-sm">
                  URL do Site
                </Label>
                <Input
                  id="url"
                  type="url"
                  value={formData.url}
                  onChange={(e) => handleInputChange("url", e.target.value)}
                  placeholder="https://exemplo.com.br"
                  className="mt-xs"
                  disabled={isLoading}
                />
              </div>
            )}

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
                      disabled={isLoading}
                    >
                      {allCategoriesSelected && <Check className="mr-1 size-3" />}
                      Todas as categorias
                    </Button>
                    {!allCategoriesSelected && (
                      <span className="text-xs text-muted-foreground">
                        {selectedCategories.length} categoria(s) selecionada(s)
                      </span>
                    )}
                  </div>

                  {!allCategoriesSelected && (
                    <div className="grid max-h-32 grid-cols-2 gap-xs overflow-y-auto sm:grid-cols-3">
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
                            disabled={isLoading}
                          >
                            {isSelected && <Check className="mr-1 size-3" />}
                            {category.name}
                          </Button>
                        );
                      })}
                    </div>
                  )}
                </div>
                <p className="mt-xs text-xs text-muted-foreground">
                  Por padrão, todas as categorias podem usar esta modalidade
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

