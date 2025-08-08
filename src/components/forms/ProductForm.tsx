import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Tag, Save, X, AlertCircle } from '@/components/ui/icons';
import { useCreateProduct, useUpdateProduct } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { ProductWithCategory, ProductFormData } from "@/types/products";
import { formatarMoeda } from "@/utils/pricing";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { useCollapsibleSection } from "@/hooks/useCollapsibleSection";

interface ProductFormProps {
  editingProduct?: ProductWithCategory | null;
  onCancel?: () => void;
}

export const ProductForm = ({ editingProduct, onCancel }: ProductFormProps = {}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    description: "",
    sku: "",
    category_id: "",
    cost_unit: 0,
    packaging_cost: 0,
    tax_rate: 0
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<keyof ProductFormData, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof ProductFormData, boolean>>>({});

  const { data: categories = [] } = useCategories();
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();

  // Validação em tempo real
  const validateField = (name: keyof ProductFormData, value: string | number) => {
    const newErrors = { ...errors };
    
    switch (name) {
      case 'name': {
        const nameValue = String(value);
        if (!nameValue.trim()) {
          newErrors.name = 'Nome é obrigatório';
        } else if (nameValue.length < 2) {
          newErrors.name = 'Nome deve ter pelo menos 2 caracteres';
        } else {
          delete newErrors.name;
        }
        break;
      }
      case 'cost_unit':
          if (typeof value === 'number' && value <= 0) {
            newErrors.cost_unit = 'Custo deve ser maior que zero';
        } else {
          delete newErrors.cost_unit;
        }
        break;
      case 'tax_rate':
          if (typeof value === 'number' && (value < 0 || value > 100)) {
            newErrors.tax_rate = 'Taxa deve estar entre 0 e 100%';
        } else {
          delete newErrors.tax_rate;
        }
        break;
      default:
        delete newErrors[name];
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Auto-save functionality (simulated)
  useEffect(() => {
    if (editingId && Object.keys(touched).length > 0) {
      const timer = setTimeout(() => {
        // Auto-save logic would go here
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [formData, editingId, touched]);

  const handleInputChange = (name: keyof ProductFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar todos os campos antes de enviar
    const isValid = validateField('name', formData.name) && 
                   validateField('cost_unit', formData.cost_unit) &&
                   validateField('tax_rate', formData.tax_rate);
    
    if (!isValid) {
      toast({
        title: "Erro de validação",
        description: "Corrija os erros no formulário antes de continuar",
        variant: "destructive"
      });
      return;
    }
    
    // Converter "none" para null antes de enviar
    const dataToSubmit = {
      ...formData,
      category_id: formData.category_id === "none" || formData.category_id === "" ? null : formData.category_id,
      sku: formData.sku || null,
      description: formData.description || null
    };
    
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: dataToSubmit }, {
        onSuccess: () => {
          resetForm();
          toast({
            title: "Sucesso",
            description: "Produto atualizado com sucesso!"
          });
        }
      });
    } else {
      createMutation.mutate(dataToSubmit, {
        onSuccess: () => {
          resetForm();
          toast({
            title: "Sucesso", 
            description: "Produto criado com sucesso!"
          });
        }
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      sku: "",
      category_id: "",
      cost_unit: 0,
      packaging_cost: 0,
      tax_rate: 0
    });
    setEditingId(null);
    setErrors({});
    setTouched({});
  };

  useEffect(() => {
    if (editingProduct) {
      setFormData({
        name: editingProduct.name,
        description: editingProduct.description || "",
        sku: editingProduct.sku || "",
        category_id: editingProduct.category_id || "none",
        cost_unit: editingProduct.cost_unit || 0,
        packaging_cost: editingProduct.packaging_cost || 0,
        tax_rate: editingProduct.tax_rate || 0
      });
      setEditingId(editingProduct.id);
      setErrors({});
      setTouched({});
    } else {
      resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingProduct]);

  // Calcular custo total para exibição
  const custoTotal = formData.cost_unit + formData.packaging_cost;

  const optionalFields = useCollapsibleSection({
    storageKey: 'products-optional-fields',
    defaultOpen: false
  });


  return (
    <div className="space-y-6">
      {/* Formulário Principal - Layout Coeso */}
      <Card className="shadow-card border border-border/50">
        <CardHeader className="bg-card">
          <CardTitle className="text-xl flex items-center gap-2">
            <Package className="w-6 h-6" />
            {editingId ? "Editar Produto" : "Novo Produto"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informações Básicas */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
                Informações Básicas
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="text-sm font-medium">
                    Nome *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Ex: Smartphone Samsung Galaxy"
                    className={cn(
                      "mt-1",
                      errors.name && touched.name ? "border-destructive focus-visible:ring-destructive" : ""
                    )}
                    required
                  />
                  {errors.name && touched.name && (
                    <div className="flex items-center gap-1 mt-1 text-sm text-destructive">
                      <AlertCircle className="w-3 h-3" />
                      {errors.name}
                    </div>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="category" className="text-sm font-medium">Categoria</Label>
                  <Select 
                    value={formData.category_id} 
                    onValueChange={(value) => handleInputChange("category_id", value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhuma categoria</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Configuração de Custos */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
                Configuração de Custos
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="cost_unit" className="text-sm font-medium">
                    Custo Unitário (R$) *
                  </Label>
                  <Input
                    id="cost_unit"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.cost_unit}
                    onChange={(e) => handleInputChange("cost_unit", parseFloat(e.target.value) || 0)}
                    placeholder="0,00"
                    className={cn(
                      "mt-1",
                      errors.cost_unit && touched.cost_unit ? "border-destructive focus-visible:ring-destructive" : ""
                    )}
                    required
                  />
                  {errors.cost_unit && touched.cost_unit && (
                    <div className="flex items-center gap-1 mt-1 text-sm text-destructive">
                      <AlertCircle className="w-3 h-3" />
                      {errors.cost_unit}
                    </div>
                  )}
                </div>
                
                <div>
                  <Label htmlFor="packaging_cost" className="text-sm font-medium">
                    Custo da Embalagem (R$)
                  </Label>
                  <Input
                    id="packaging_cost"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.packaging_cost}
                    onChange={(e) => handleInputChange("packaging_cost", parseFloat(e.target.value) || 0)}
                    placeholder="0,00"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="tax_rate" className="text-sm font-medium">
                    Alíquota de Imposto (%)
                  </Label>
                  <Input
                    id="tax_rate"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.tax_rate}
                    onChange={(e) => handleInputChange("tax_rate", parseFloat(e.target.value) || 0)}
                    placeholder="0,00"
                    className={cn(
                      "mt-1",
                      errors.tax_rate && touched.tax_rate ? "border-destructive focus-visible:ring-destructive" : ""
                    )}
                  />
                  {errors.tax_rate && touched.tax_rate && (
                    <div className="flex items-center gap-1 mt-1 text-sm text-destructive">
                      <AlertCircle className="w-3 h-3" />
                      {errors.tax_rate}
                    </div>
                  )}
                </div>
              </div>

              {/* Preview do custo total */}
              {custoTotal > 0 && (
                <div className="bg-muted/30 p-4 rounded-lg border border-border/30">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Custo Total:</span>
                    <span className="text-lg font-bold text-brand-primary">
                      {formatarMoeda(custoTotal)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Campos Opcionais */}
            <CollapsibleCard
              title="Campos Opcionais"
              icon={<Tag className="w-4 h-4" />}
              isOpen={optionalFields.isOpen}
              onToggle={optionalFields.toggle}
            >
              <div className="space-y-4">
                <div>
                  <Label htmlFor="sku" className="text-sm font-medium">SKU</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => handleInputChange("sku", e.target.value)}
                    placeholder="Ex: SM-G991B"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="description" className="text-sm font-medium">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Descrição detalhada do produto..."
                    className="mt-1 min-h-[80px]"
                  />
                </div>
              </div>
            </CollapsibleCard>

            {/* Botões de Ação */}
            <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="flex-1 h-11 bg-gradient-primary hover:opacity-90"
              >
                <Save className="w-4 h-4 mr-2" />
                {editingId ? "Atualizar Produto" : "Criar Produto"}
              </Button>
              {editingId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    resetForm();
                    onCancel?.();
                  }}
                  className="h-11 min-w-[120px]"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};