import { useState, useEffect } from "react";
import { Package, DollarSign, Tag, Calculator } from "lucide-react";
import { SmartForm } from "@/components/ui/smart-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCategories } from "@/hooks/useCategories";
import { useCreateProduct, useUpdateProduct } from "@/hooks/useProducts";
import { ProductType, ProductFormData } from "@/types/products";

interface ProductFormEnhancedProps {
  editingProduct?: ProductType | null;
  onCancelEdit?: () => void;
}

export function ProductFormEnhanced({ 
  editingProduct, 
  onCancelEdit 
}: ProductFormEnhancedProps) {
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    description: "",
    sku: "",
    cost_unit: 0,
    packaging_cost: 0,
    tax_rate: 0,
    category_id: ""
  });

  const [isDirty, setIsDirty] = useState(false);
  const { data: categories = [] } = useCategories();
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();

  const isEditing = !!editingProduct;
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (editingProduct) {
      setFormData({
        name: editingProduct.name,
        description: editingProduct.description || "",
        sku: editingProduct.sku || "",
        cost_unit: editingProduct.cost_unit || 0,
        packaging_cost: editingProduct.packaging_cost || 0,
        tax_rate: editingProduct.tax_rate || 0,
        category_id: editingProduct.category_id || ""
      });
      setIsDirty(false);
    }
  }, [editingProduct]);

  const handleInputChange = (field: keyof ProductFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isEditing && editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data: formData }, {
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
            sku: "",
            cost_unit: 0,
            packaging_cost: 0,
            tax_rate: 0,
            category_id: ""
          });
          setIsDirty(false);
        }
      });
    }
  };

  const sections = [
    {
      id: "basic",
      title: "Informações Básicas",
      description: "Dados fundamentais do produto",
      icon: <Package className="w-4 h-4" />,
      required: true,
      children: (
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Nome do Produto *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="sku">SKU</Label>
            <Input
              id="sku"
              value={formData.sku}
              onChange={(e) => handleInputChange("sku", e.target.value)}
              placeholder="Código único do produto"
            />
          </div>

          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="category">Categoria *</Label>
            <Select
              value={formData.category_id}
              onValueChange={(value) => handleInputChange("category_id", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )
    },
    {
      id: "costs",
      title: "Custos e Impostos",
      description: "Valores para cálculo de precificação",
      icon: <DollarSign className="w-4 h-4" />,
      required: true,
      children: (
        <div className="space-y-4">
          <div>
            <Label htmlFor="cost_unit">Custo Unitário (R$) *</Label>
            <Input
              id="cost_unit"
              type="number"
              step="0.01"
              min="0"
              value={formData.cost_unit}
              onChange={(e) => handleInputChange("cost_unit", parseFloat(e.target.value) || 0)}
              required
            />
          </div>

          <div>
            <Label htmlFor="packaging_cost">Custo de Embalagem (R$)</Label>
            <Input
              id="packaging_cost"
              type="number"
              step="0.01"
              min="0"
              value={formData.packaging_cost}
              onChange={(e) => handleInputChange("packaging_cost", parseFloat(e.target.value) || 0)}
            />
          </div>

          <div>
            <Label htmlFor="tax_rate">Taxa de Impostos (%)</Label>
            <Input
              id="tax_rate"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={formData.tax_rate}
              onChange={(e) => handleInputChange("tax_rate", parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>
      )
    }
  ];

  return (
    <SmartForm
      title={isEditing ? "Editar Produto" : "Novo Produto"}
      description={isEditing ? "Atualize as informações do produto" : "Configure um novo produto para precificação"}
      sections={sections}
      isEditing={isEditing}
      isDirty={isDirty}
      isSubmitting={isSubmitting}
      onSubmit={handleSubmit}
      onCancel={isEditing ? () => onCancelEdit?.() : undefined}
      submitLabel={isEditing ? "Atualizar Produto" : "Criar Produto"}
    />
  );
}