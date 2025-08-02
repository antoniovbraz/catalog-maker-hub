import { useState, useEffect } from "react";
import { Percent, Store, Tag, Calculator } from "lucide-react";
import { SmartForm } from "@/components/ui/smart-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useMarketplaces } from "@/hooks/useMarketplaces";
import { useCategories } from "@/hooks/useCategories";
import { useCreateCommission, useUpdateCommission } from "@/hooks/useCommissions";
import { CommissionFormData, CommissionWithDetails } from "@/types/commissions";

interface CommissionFormEnhancedProps {
  editingCommission?: CommissionWithDetails | null;
  onCancelEdit?: () => void;
}

export function CommissionFormEnhanced({ 
  editingCommission, 
  onCancelEdit 
}: CommissionFormEnhancedProps) {
  const [formData, setFormData] = useState<CommissionFormData>({
    marketplace_id: "",
    category_id: "",
    rate: 0
  });

  const [isDirty, setIsDirty] = useState(false);

  const { data: marketplaces = [] } = useMarketplaces();
  const { data: categories = [] } = useCategories();
  const createMutation = useCreateCommission();
  const updateMutation = useUpdateCommission();

  const isEditing = !!editingCommission;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (editingCommission) {
      setFormData({
        marketplace_id: editingCommission.marketplace_id,
        category_id: editingCommission.category_id || "default",
        rate: editingCommission.rate * 100 // Convert to percentage
      });
      setIsDirty(false);
    } else {
      setFormData({
        marketplace_id: "",
        category_id: "",
        rate: 0
      });
      setIsDirty(false);
    }
  }, [editingCommission]);

  const handleInputChange = (field: keyof CommissionFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert "default" to null and percentage to decimal before submitting
    const dataToSubmit = {
      ...formData,
      category_id: formData.category_id === "default" ? null : formData.category_id || null,
      rate: formData.rate / 100 // Convert percentage (14) to decimal (0.14)
    };
    
    if (isEditing && editingCommission) {
      updateMutation.mutate({ id: editingCommission.id, data: dataToSubmit }, {
        onSuccess: () => {
          setIsDirty(false);
          onCancelEdit?.();
        }
      });
    } else {
      createMutation.mutate(dataToSubmit, {
        onSuccess: () => {
          setFormData({
            marketplace_id: "",
            category_id: "",
            rate: 0
          });
          setIsDirty(false);
        }
      });
    }
  };

  const handleCancel = () => {
    setFormData({
      marketplace_id: "",
      category_id: "",
      rate: 0
    });
    setIsDirty(false);
    onCancelEdit?.();
  };

  // Calculate impact preview
  const getImpactPreview = (rate: number) => {
    if (rate === 0) return null;
    
    const impactLevel = rate;
    let color = "text-success";
    let label = "Baixo impacto no preço";
    
    if (impactLevel > 10) {
      color = "text-warning";
      label = "Médio impacto no preço";
    }
    if (impactLevel > 20) {
      color = "text-destructive";
      label = "Alto impacto no preço";
    }
    
    return (
      <div className={`text-sm ${color} mt-2`}>
        <Calculator className="w-4 h-4 inline mr-1" />
        {label}
      </div>
    );
  };

  const sections = [
    {
      id: "marketplace",
      title: "Marketplace",
      description: "Selecione o marketplace para esta comissão",
      icon: <Store className="w-4 h-4" />,
      required: true,
      children: (
        <div>
          <Label htmlFor="marketplace">Marketplace *</Label>
          <Select 
            value={formData.marketplace_id} 
            onValueChange={(value) => handleInputChange("marketplace_id", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um marketplace" />
            </SelectTrigger>
            <SelectContent>
              {marketplaces.map((marketplace) => (
                <SelectItem key={marketplace.id} value={marketplace.id}>
                  {marketplace.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )
    },
    {
      id: "category",
      title: "Categoria",
      description: "Categoria específica ou geral para todos os produtos",
      icon: <Tag className="w-4 h-4" />,
      children: (
        <div>
          <Label htmlFor="category">Categoria</Label>
          <Select 
            value={formData.category_id} 
            onValueChange={(value) => handleInputChange("category_id", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma categoria (ou deixe vazio para padrão)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">
                <div className="flex items-center gap-2">
                  Padrão (todas as categorias)
                  <Badge variant="outline" className="text-xs">Geral</Badge>
                </div>
              </SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">
            Comissões específicas por categoria têm prioridade sobre a padrão
          </p>
        </div>
      )
    },
    {
      id: "rate",
      title: "Taxa de Comissão",
      description: "Percentual cobrado pelo marketplace",
      icon: <Percent className="w-4 h-4" />,
      required: true,
      children: (
        <div>
          <Label htmlFor="rate">Taxa de Comissão (%) *</Label>
          <div className="relative">
            <Input
              id="rate"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={formData.rate}
              onChange={(e) => handleInputChange("rate", parseFloat(e.target.value) || 0)}
              placeholder="Ex: 14 para 14%"
              required
            />
            <Percent className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Digite o valor em percentual (ex: 14 para 14%)
          </p>
          {getImpactPreview(formData.rate)}
        </div>
      )
    }
  ];

  return (
    <SmartForm
      title={isEditing ? "Editar Comissão" : "Nova Comissão"}
      description={isEditing ? "Atualize a taxa de comissão" : "Configure uma nova taxa de comissão para cálculo de preços"}
      sections={sections}
      isEditing={isEditing}
      isDirty={isDirty}
      isSubmitting={isSubmitting}
      onSubmit={handleSubmit}
      onCancel={isEditing ? handleCancel : undefined}
      submitLabel={isEditing ? "Atualizar Comissão" : "Criar Comissão"}
    />
  );
}