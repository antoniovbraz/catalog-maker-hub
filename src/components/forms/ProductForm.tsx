import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit, Package, Tag, Save, X, AlertCircle } from '@/components/ui/icons';
import { useProductsWithCategories, useCreateProduct, useUpdateProduct, useDeleteProduct } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { ProductWithCategory, ProductFormData } from "@/types/products";
import { formatarMoeda } from "@/utils/pricing";
import { DataVisualization } from "@/components/ui/data-visualization";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

export const ProductForm = () => {
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
  const { data: products = [], isLoading } = useProductsWithCategories();
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();
  const deleteMutation = useDeleteProduct();

  // Validação em tempo real
  const validateField = (name: keyof ProductFormData, value: string | number) => {
    const newErrors = { ...errors };
    
    switch (name) {
      case 'name':
        const nameValue = String(value);
        if (!nameValue.trim()) {
          newErrors.name = 'Nome é obrigatório';
        } else if (nameValue.length < 2) {
          newErrors.name = 'Nome deve ter pelo menos 2 caracteres';
        } else {
          delete newErrors.name;
        }
        break;
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
    
    // Converter "none" para undefined/null antes de enviar
    const dataToSubmit = {
      ...formData,
      category_id: formData.category_id === "none" ? undefined : formData.category_id,
      sku: formData.sku || undefined,
      description: formData.description || undefined
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

  const handleEdit = (product: ProductWithCategory) => {
    setFormData({
      name: product.name,
      description: product.description || "",
      sku: product.sku || "",
      category_id: product.category_id || "none",
      cost_unit: product.cost_unit || 0,
      packaging_cost: product.packaging_cost || 0,
      tax_rate: product.tax_rate || 0
    });
    setEditingId(product.id);
    setErrors({});
    setTouched({});
  };

  // Calcular custo total para exibição
  const custoTotal = formData.cost_unit + formData.packaging_cost;

  // Configurar colunas da tabela
  const columns = [
    {
      key: 'name',
      header: 'Nome',
      render: (item: ProductWithCategory) => (
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-muted-foreground" />
          <div>
            <span className="font-medium">{item.name}</span>
            {item.sku && (
              <Badge variant="outline" className="ml-2 text-xs">
                {item.sku}
              </Badge>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'categories.name',
      header: 'Categoria',
      render: (item: ProductWithCategory) => (
        <div className="flex items-center gap-1">
          <Tag className="w-3 h-3 text-muted-foreground" />
          <span>{item.categories?.name || "Sem categoria"}</span>
        </div>
      )
    },
    {
      key: 'cost_unit',
      header: 'Custo Unit.',
      render: (item: ProductWithCategory) => (
        <span className="font-mono text-sm">{formatarMoeda(item.cost_unit || 0)}</span>
      )
    },
    {
      key: 'packaging_cost',
      header: 'Embalagem',
      render: (item: ProductWithCategory) => (
        <span className="font-mono text-sm text-muted-foreground">
          {formatarMoeda(item.packaging_cost || 0)}
        </span>
      )
    }
  ];

  const actions = [
    {
      label: 'Editar',
      icon: <Edit className="w-4 h-4" />,
      onClick: (product: ProductWithCategory) => handleEdit(product)
    },
    {
      label: 'Excluir',
      icon: <Trash2 className="w-4 h-4" />,
      onClick: (product: ProductWithCategory) => deleteMutation.mutate(product.id),
      variant: 'destructive' as const
    }
  ];

  return (
    <div className="space-y-xl">
      {/* Form Section */}
      <Card className="shadow-form border border-border/50">
        <CardHeader className="bg-gradient-primary text-white rounded-t-lg">
          <CardTitle className="text-xl flex items-center gap-2">
            <Package className="w-6 h-6" />
            {editingId ? "✏️ Editar Produto" : "➕ Novo Produto"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-lg p-lg">
          <form onSubmit={handleSubmit} className="space-y-lg">
            {/* Seção de Informações Básicas */}
            <div className="space-y-md">
              <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2 flex items-center gap-2">
                📝 Informações Básicas
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
                  <Label htmlFor="sku" className="text-sm font-medium">SKU</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => handleInputChange("sku", e.target.value)}
                    placeholder="Ex: SM-G991B"
                    className="mt-1"
                  />
                </div>
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

            <Separator />

            {/* Seção de Custos */}
            <div className="space-y-md">
              <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2 flex items-center gap-2">
                💰 Configuração de Custos
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
                <div className="bg-muted/50 p-md rounded-lg border border-border/50">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Custo Total:</span>
                    <span className="text-lg font-bold text-primary">
                      {formatarMoeda(custoTotal)}
                    </span>
                  </div>
                </div>
              )}
            </div>
            
            <Separator />

            {/* Botões de Ação */}
            <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 h-11 bg-gradient-primary hover:opacity-90 shadow-hover"
                >
                <Save className="w-4 h-4 mr-2" />
                {editingId ? "💾 Atualizar Produto" : "➕ Criar Produto"}
              </Button>
              {editingId && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={resetForm}
                  className="h-11 min-w-[120px] shadow-form"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Lista de Produtos */}
      <DataVisualization
        title="📦 Produtos Cadastrados"
        data={products}
        columns={columns}
        actions={actions}
        isLoading={isLoading}
        emptyState={
          <div className="text-center py-8">
            <p className="text-muted-foreground">Nenhum produto cadastrado</p>
            <p className="text-sm text-muted-foreground">
              Crie seu primeiro produto usando o formulário acima
            </p>
          </div>
        }
      />
    </div>
  );
};