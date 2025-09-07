import { useCallback, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tag, AlertCircle } from "@/components/ui/icons";
import { useCategories } from "@/hooks/useCategories";
import { useCreateProduct, useUpdateProduct } from "@/hooks/useProducts";
import type { ProductWithCategory, ProductFormData } from "@/types/products";
import { formatarMoeda } from "@/utils/pricing";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { useCollapsibleSection } from "@/hooks/useCollapsibleSection";

interface ProductModalFormProps {
  product?: ProductWithCategory;
  onSuccess: () => void;
  onSubmitForm: (submitFn: () => Promise<void>) => void;
}

export function ProductModalForm({ product, onSuccess, onSubmitForm }: ProductModalFormProps) {
  const { toast } = useToast();
  const isEdit = !!product;
  const { data: categories = [] } = useCategories();
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();

  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    description: "",
    sku: "",
    category_id: "",
    cost_unit: 0,
    packaging_cost: 0,
    tax_rate: 0,
    sku_source: "internal" as const,
    source: "manual" as const,
    origin: "manual" as const,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ProductFormData, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof ProductFormData, boolean>>>({});

  useEffect(() => {
    if (product) {
        setFormData({
          name: product.name,
          description: product.description || "",
          sku: product.sku || "",
          category_id: product.category_id || "none",
          cost_unit: product.cost_unit || 0,
          packaging_cost: product.packaging_cost || 0,
          tax_rate: product.tax_rate || 0,
          source: product.source || "manual",
          origin: product.origin || "manual", 
          sku_source: product.sku_source || "none",
        });
    } else {
      setFormData({
        name: "",
        description: "",
        sku: "",
        category_id: "",
        cost_unit: 0,
        packaging_cost: 0,
        tax_rate: 0,
        sku_source: "internal" as const,
        source: "manual" as const,
        origin: "manual" as const,
      });
    }
    setErrors({});
    setTouched({});
  }, [product]);

  const validateField = useCallback(
    (name: keyof ProductFormData, value: string | number) => {
      const newErrors = { ...errors };

      switch (name) {
        case "name": {
          const nameValue = String(value);
          if (!nameValue.trim()) {
            newErrors.name = "Nome é obrigatório";
          } else if (nameValue.length < 2) {
            newErrors.name = "Nome deve ter pelo menos 2 caracteres";
          } else {
            delete newErrors.name;
          }
          break;
        }
        case "cost_unit":
          if (typeof value === "number" && value <= 0) {
            newErrors.cost_unit = "Custo deve ser maior que zero";
          } else {
            delete newErrors.cost_unit;
          }
          break;
        case "tax_rate":
          if (typeof value === "number" && (value < 0 || value > 100)) {
            newErrors.tax_rate = "Taxa deve estar entre 0 e 100%";
          } else {
            delete newErrors.tax_rate;
          }
          break;
        default:
          delete newErrors[name];
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    },
    [errors]
  );

  const handleInputChange = (name: keyof ProductFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setTouched((prev) => ({ ...prev, [name]: true }));
    validateField(name, value);
  };

  const onSubmit = useCallback(async () => {
    const isValid =
      validateField("name", formData.name) &&
      validateField("cost_unit", formData.cost_unit) &&
      validateField("tax_rate", formData.tax_rate);

    if (!isValid) {
      toast({
        title: "Erro de validação",
        description: "Corrija os erros no formulário antes de continuar",
        variant: "destructive",
      });
      throw new Error("validation error");
    }

    const dataToSubmit = {
      ...formData,
      sku_source: (
        product?.sku_source === "mercado_livre"
          ? product.sku_source
          : formData.sku
            ? "internal"
            : "none"
      ) as "none" | "mercado_livre" | "internal",
      category_id:
        formData.category_id === "none" || formData.category_id === ""
          ? null
          : formData.category_id,
      sku: formData.sku || undefined,
      description: formData.description || undefined,
    };

    if (isEdit) {
      await updateMutation.mutateAsync({ id: product!.id, data: dataToSubmit });
    } else {
      await createMutation.mutateAsync(dataToSubmit);
    }
    onSuccess();
  }, [
    formData,
    isEdit,
    product,
    toast,
    updateMutation,
    createMutation,
    onSuccess,
    validateField,
  ]);

  const handleSubmit = useCallback(async () => {
    await onSubmit();
  }, [onSubmit]);

  useEffect(() => {
    onSubmitForm(handleSubmit);
  }, [onSubmitForm, handleSubmit]);

  const optionalFields = useCollapsibleSection({
    storageKey: "products-optional-fields",
    defaultOpen: false,
  });

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const custoTotal = formData.cost_unit + formData.packaging_cost;
  const isMLProduct =
    product?.source === "mercado_livre" || product?.origin === "mercado_livre";

  return (
    <div className="space-y-6">
      {/* Informações Básicas */}
      <div className="space-y-4">
        <h3 className="border-b border-border pb-2 text-lg font-semibold text-foreground">
          Informações Básicas
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                errors.name && touched.name
                  ? "border-destructive focus-visible:ring-destructive"
                  : ""
              )}
              disabled={isLoading}
            />
            {errors.name && touched.name && (
              <div className="mt-1 flex items-center gap-1 text-sm text-destructive">
                <AlertCircle className="size-3" />
                {errors.name}
              </div>
            )}
          </div>
          <div>
            <Label htmlFor="category" className="text-sm font-medium">
              Categoria
            </Label>
            <Select
              value={formData.category_id}
              onValueChange={(value) => handleInputChange("category_id", value)}
              disabled={isLoading}
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
        <h3 className="border-b border-border pb-2 text-lg font-semibold text-foreground">
          Configuração de Custos
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
              onChange={(e) =>
                handleInputChange("cost_unit", parseFloat(e.target.value) || 0)
              }
              placeholder="0,00"
              className={cn(
                "mt-1",
                errors.cost_unit && touched.cost_unit
                  ? "border-destructive focus-visible:ring-destructive"
                  : ""
              )}
              disabled={isLoading}
            />
            {errors.cost_unit && touched.cost_unit && (
              <div className="mt-1 flex items-center gap-1 text-sm text-destructive">
                <AlertCircle className="size-3" />
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
              onChange={(e) =>
                handleInputChange(
                  "packaging_cost",
                  parseFloat(e.target.value) || 0
                )
              }
              placeholder="0,00"
              className="mt-1"
              disabled={isLoading}
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
              onChange={(e) =>
                handleInputChange("tax_rate", parseFloat(e.target.value) || 0)
              }
              placeholder="0,00"
              className={cn(
                "mt-1",
                errors.tax_rate && touched.tax_rate
                  ? "border-destructive focus-visible:ring-destructive"
                  : ""
              )}
              disabled={isLoading}
            />
            {errors.tax_rate && touched.tax_rate && (
              <div className="mt-1 flex items-center gap-1 text-sm text-destructive">
                <AlertCircle className="size-3" />
                {errors.tax_rate}
              </div>
            )}
          </div>
        </div>

        {custoTotal > 0 && (
          <div className="rounded-lg border border-border/30 bg-muted/30 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Custo Total:</span>
              <span className="text-lg font-bold text-primary">
                {formatarMoeda(custoTotal)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Campos Opcionais */}
      <CollapsibleCard
        title="Campos Opcionais"
        icon={<Tag className="size-4" />}
        isOpen={optionalFields.isOpen}
        onToggle={optionalFields.toggle}
      >
        <div className="space-y-4">
          {isMLProduct ? (
            <div>
              <Label htmlFor="sku" className="text-sm font-medium">
                SKU
              </Label>
              <p className="mt-1 text-sm text-muted-foreground">
                SKU deve ser definido no Mercado Livre.
              </p>
            </div>
          ) : (
            <div>
              <Label htmlFor="sku" className="text-sm font-medium">
                SKU
              </Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => handleInputChange("sku", e.target.value)}
                placeholder="Ex: SM-G991B"
                className="mt-1"
                disabled={isLoading}
              />
            </div>
          )}
          <div>
            <Label htmlFor="description" className="text-sm font-medium">
              Descrição
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Descrição detalhada do produto..."
              className="mt-1 min-h-[80px]"
              disabled={isLoading}
            />
          </div>
        </div>
      </CollapsibleCard>
    </div>
  );
}

