import { useState, useEffect } from "react";
import { Store, Link, FileText, Network } from "lucide-react";
import { SmartForm } from "@/components/ui/smart-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMarketplaceParents, useCreateMarketplace, useUpdateMarketplace } from "@/hooks/useMarketplaces";
import { MarketplaceType, MarketplaceFormData } from "@/types/marketplaces";

interface MarketplaceFormEnhancedProps {
  editingMarketplace?: MarketplaceType | null;
  onCancelEdit?: () => void;
}

export function MarketplaceFormEnhanced({ 
  editingMarketplace, 
  onCancelEdit 
}: MarketplaceFormEnhancedProps) {
  const [formData, setFormData] = useState<MarketplaceFormData>({
    name: "",
    description: "",
    url: "",
    parent_marketplace_id: null
  });

  const [isDirty, setIsDirty] = useState(false);

  const { data: parentMarketplaces = [] } = useMarketplaceParents();
  const createMutation = useCreateMarketplace();
  const updateMutation = useUpdateMarketplace();

  const isEditing = !!editingMarketplace;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (editingMarketplace) {
      setFormData({
        name: editingMarketplace.name,
        description: editingMarketplace.description || "",
        url: editingMarketplace.url || "",
        parent_marketplace_id: editingMarketplace.parent_marketplace_id || null
      });
      setIsDirty(false);
    } else {
      setFormData({
        name: "",
        description: "",
        url: "",
        parent_marketplace_id: null
      });
      setIsDirty(false);
    }
  }, [editingMarketplace]);

  const handleInputChange = (field: keyof MarketplaceFormData, value: string | null) => {
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
            parent_marketplace_id: null
          });
          setIsDirty(false);
        }
      });
    }
  };

  const handleCancel = () => {
    setFormData({
      name: "",
      description: "",
      url: "",
      parent_marketplace_id: null
    });
    setIsDirty(false);
    onCancelEdit?.();
  };

  const sections = [
    {
      id: "basic",
      title: "Informações Básicas",
      description: "Dados fundamentais do marketplace",
      icon: <Store className="w-4 h-4" />,
      required: true,
      children: (
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Nome do Marketplace *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Ex: Mercado Livre, Amazon, Shopee"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Descreva as características deste marketplace"
              rows={3}
            />
          </div>
        </div>
      )
    },
    {
      id: "connection",
      title: "Conexão e URL",
      description: "Configurações de acesso ao marketplace",
      icon: <Link className="w-4 h-4" />,
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
          <p className="text-xs text-muted-foreground mt-1">
            URL principal do marketplace para referência
          </p>
        </div>
      )
    },
    {
      id: "hierarchy",
      title: "Hierarquia",
      description: "Defina a relação com outros marketplaces",
      icon: <Network className="w-4 h-4" />,
      children: (
        <div>
          <Label htmlFor="parent">Marketplace Pai (opcional)</Label>
          <Select
            value={formData.parent_marketplace_id || "none"}
            onValueChange={(value) => handleInputChange(
              "parent_marketplace_id", 
              value === "none" ? null : value
            )}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um marketplace pai" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhum (marketplace independente)</SelectItem>
              {parentMarketplaces.map((parent) => (
                <SelectItem key={parent.id} value={parent.id}>
                  {parent.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">
            Use para criar modalidades (ex: ML Clássico como filho de Mercado Livre)
          </p>
        </div>
      )
    }
  ];

  return (
    <SmartForm
      title={isEditing ? "Editar Marketplace" : "Novo Marketplace"}
      description={isEditing ? "Atualize as informações do marketplace" : "Configure um novo marketplace para suas vendas"}
      sections={sections}
      isEditing={isEditing}
      isDirty={isDirty}
      isSubmitting={isSubmitting}
      onSubmit={handleSubmit}
      onCancel={isEditing ? handleCancel : undefined}
      submitLabel={isEditing ? "Atualizar Marketplace" : "Criar Marketplace"}
    />
  );
}