import { useState, useEffect } from "react";
import { Store, Link, Network, Tag } from '@/components/ui/icons';
import { SmartForm } from "@/components/ui/smart-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useMarketplacePlatforms, useCreateMarketplace, useUpdateMarketplace } from "@/hooks/useMarketplaces";
import { MarketplaceType, MarketplaceFormData } from "@/types/marketplaces";

interface MarketplaceFormEnhancedProps {
  editingMarketplace?: MarketplaceType | null;
  creatingModalityForPlatform?: string | null;
  onCancelEdit?: () => void;
}

export function MarketplaceFormEnhanced({ 
  editingMarketplace, 
  creatingModalityForPlatform,
  onCancelEdit 
}: MarketplaceFormEnhancedProps) {
  const [formData, setFormData] = useState<MarketplaceFormData>({
    name: "",
    description: "",
    url: "",
    platform_id: null,
    marketplace_type: "modality",
    category_restrictions: [],
  });

  const [isDirty, setIsDirty] = useState(false);

  const { data: platforms = [] } = useMarketplacePlatforms();
  const createMutation = useCreateMarketplace();
  const updateMutation = useUpdateMarketplace();

  const isEditing = !!editingMarketplace;
  const isCreatingModality = !!creatingModalityForPlatform;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (editingMarketplace) {
      setFormData({
        name: editingMarketplace.name,
        description: editingMarketplace.description || "",
        url: editingMarketplace.url || "",
        platform_id: editingMarketplace.platform_id,
        marketplace_type: editingMarketplace.marketplace_type,
        category_restrictions: Array.isArray(editingMarketplace.category_restrictions) 
          ? editingMarketplace.category_restrictions as string[]
          : [],
      });
      setIsDirty(false);
    } else if (creatingModalityForPlatform) {
      setFormData({
        name: "",
        description: "",
        url: "",
        platform_id: creatingModalityForPlatform,
        marketplace_type: "modality",
        category_restrictions: [],
      });
      setIsDirty(false);
    } else {
      setFormData({
        name: "",
        description: "",
        url: "",
        platform_id: null,
        marketplace_type: "platform",
        category_restrictions: [],
      });
      setIsDirty(false);
    }
  }, [editingMarketplace, creatingModalityForPlatform]);

  const handleInputChange = (field: keyof MarketplaceFormData, value: string | null | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isEditing && editingMarketplace) {
      updateMutation.mutate({ id: editingMarketplace.id, data: formData }, {
        onSuccess: () => {
          setIsDirty(false);
          onCancelEdit?.();
        }
      });
    } else {
      createMutation.mutate(formData, {
        onSuccess: () => {
          setFormData({
            name: "",
            description: "",
            url: "",
            platform_id: null,
            marketplace_type: isCreatingModality ? "modality" : "platform",
            category_restrictions: [],
          });
          setIsDirty(false);
          onCancelEdit?.();
        }
      });
    }
  };

  const handleCancel = () => {
    setFormData({
      name: "",
      description: "",
      url: "",
      platform_id: null,
      marketplace_type: "platform",
      category_restrictions: [],
    });
    setIsDirty(false);
    onCancelEdit?.();
  };

  const sections = [
    {
      id: "basic",
      title: "Informações Básicas",
      description: "Dados fundamentais do marketplace",
      icon: <Store className="size-4" />,
      required: true,
      children: (
        <div className="space-y-md">
          <div>
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Ex: Mercado Livre Clássico, Shopee Frete Grátis"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Descreva as características desta modalidade"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="marketplace_type">Tipo</Label>
            <Select
              value={formData.marketplace_type}
              onValueChange={(value) => handleInputChange("marketplace_type", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="platform">
                  <div className="flex items-center gap-2">
                    <Badge variant="default">Plataforma</Badge>
                    <span>Ex: Mercado Livre, Shopee</span>
                  </div>
                </SelectItem>
                <SelectItem value="modality">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Modalidade</Badge>
                    <span>Ex: ML Clássico, Shopee Frete Grátis</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )
    },
    {
      id: "connection",
      title: "Conexão e URL",
      description: "Configurações de acesso ao marketplace",
      icon: <Link className="size-4" />,
      children: (
        <div>
          <Label htmlFor="url">URL do Marketplace</Label>
          <Input
            id="url"
            type="url"
            value={formData.url}
            onChange={(e) => handleInputChange("url", e.target.value)}
            placeholder="https://exemplo.com.br"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            URL principal do marketplace para referência
          </p>
        </div>
      )
    },
    {
      id: "hierarchy",
      title: "Plataforma",
      description: "Defina a plataforma pai para modalidades",
      icon: <Network className="size-4" />,
      children: (
        <div>
          <Label htmlFor="platform">Plataforma (para modalidades)</Label>
          <Select
            value={formData.platform_id || "none"}
            onValueChange={(value) => handleInputChange(
              "platform_id", 
              value === "none" ? null : value
            )}
            disabled={formData.marketplace_type === "platform"}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma plataforma" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhuma (para plataformas)</SelectItem>
              {platforms.map((platform) => (
                <SelectItem key={platform.id} value={platform.id}>
                  {platform.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="mt-1 text-xs text-muted-foreground">
            {formData.marketplace_type === "platform" 
              ? "Plataformas não precisam de plataforma pai" 
              : "Modalidades devem ter uma plataforma pai"}
          </p>
        </div>
      )
    },
    {
      id: "restrictions",
      title: "Restrições de Categoria",
      description: "Defina quais categorias podem usar esta modalidade",
      icon: <Tag className="size-4" />,
      children: (
        <div>
          <Label htmlFor="restrictions">Categorias Permitidas</Label>
          <Input
            id="restrictions"
            value={Array.isArray(formData.category_restrictions) ? formData.category_restrictions.join(", ") : ""}
            onChange={(e) => handleInputChange("category_restrictions", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
            placeholder="livros, books (deixe vazio para todas as categorias)"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Separe por vírgula. Deixe vazio para permitir todas as categorias.
            Ex: "livros, books" para modalidades específicas de livros.
          </p>
        </div>
      )
    }
  ];

  const getFormTitle = () => {
    if (isEditing) {
      return `Editar ${editingMarketplace?.marketplace_type === 'platform' ? 'Plataforma' : 'Modalidade'}`;
    }
    if (isCreatingModality) {
      return 'Nova Modalidade';
    }
    return 'Nova Plataforma';
  };

  const getFormDescription = () => {
    if (isEditing) {
      return `Edite as informações da ${editingMarketplace?.marketplace_type === 'platform' ? 'plataforma' : 'modalidade'}`;
    }
    if (isCreatingModality) {
      return 'Adicione uma nova modalidade para esta plataforma';
    }
    return 'Crie uma nova plataforma de marketplace';
  };

  return (
    <SmartForm
      title={getFormTitle()}
      description={getFormDescription()}
      sections={sections}
      isEditing={isEditing}
      isDirty={isDirty}
      isSubmitting={isSubmitting}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      submitLabel={isEditing ? "Salvar Alterações" : (isCreatingModality ? "Criar Modalidade" : "Criar Plataforma")}
    />
  );
}