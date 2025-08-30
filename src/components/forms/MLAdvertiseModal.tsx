import { useState, useCallback, useEffect } from "react";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Package, DollarSign, Tag, Info } from "@/components/ui/icons";
import type { ProductWithCategory } from "@/types/products";
import { formatarMoeda } from "@/utils/pricing";
import { cn } from "@/lib/utils";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { useCollapsibleSection } from "@/hooks/useCollapsibleSection";

interface MLAdvertiseModalProps {
  product: ProductWithCategory;
  onSuccess: () => void;
  onSubmitForm: (submitFn: () => Promise<void>) => void;
}

interface MLAdvertiseFormData {
  title: string;
  description: string;
  price: number;
  available_quantity: number;
  listing_type: 'gold_special' | 'gold_pro' | 'free';
  condition: 'new' | 'used' | 'not_specified';
  category_id?: string;
}

export function MLAdvertiseModal({ product, onSuccess, onSubmitForm }: MLAdvertiseModalProps) {
  const [formData, setFormData] = useState<MLAdvertiseFormData>({
    title: product.name,
    description: product.description || '',
    price: 0,
    available_quantity: 1,
    listing_type: 'gold_special',
    condition: 'new',
    category_id: undefined,
  });
  
  const [errors, setErrors] = useState<Partial<Record<keyof MLAdvertiseFormData, string>>>({});
  const [isLoading, setIsLoading] = useState(false);

  const advancedFields = useCollapsibleSection({
    storageKey: "ml-advertise-advanced",
    defaultOpen: false,
  });

  const validateField = useCallback(
    (name: keyof MLAdvertiseFormData, value: string | number) => {
      const newErrors = { ...errors };

      switch (name) {
        case "title": {
          const titleValue = String(value);
          if (!titleValue.trim()) {
            newErrors.title = "Título é obrigatório";
          } else if (titleValue.length < 5) {
            newErrors.title = "Título deve ter pelo menos 5 caracteres";
          } else if (titleValue.length > 60) {
            newErrors.title = "Título não pode exceder 60 caracteres";
          } else {
            delete newErrors.title;
          }
          break;
        }
        case "price":
          if (typeof value === "number" && value <= 0) {
            newErrors.price = "Preço deve ser maior que zero";
          } else {
            delete newErrors.price;
          }
          break;
        case "available_quantity":
          if (typeof value === "number" && value < 1) {
            newErrors.available_quantity = "Quantidade deve ser pelo menos 1";
          } else {
            delete newErrors.available_quantity;
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

  const handleInputChange = (name: keyof MLAdvertiseFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  const onSubmit = useCallback(async () => {
    const isValid =
      validateField("title", formData.title) &&
      validateField("price", formData.price) &&
      validateField("available_quantity", formData.available_quantity);

    if (!isValid) {
      throw new Error("Corrija os erros no formulário antes de continuar");
    }

    setIsLoading(true);
    try {
      // Implementar criação de anúncio no ML
      const { useMLCreateAd } = await import("@/hooks/useMLSync");
      // TODO: Implementar integração real
      console.log('Creating ML ad:', { product_id: product.id, ...formData });
      onSuccess();
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [formData, product.id, onSuccess, validateField]);

  const handleSubmit = useCallback(async () => {
    await onSubmit();
  }, [onSubmit]);

  useEffect(() => {
    onSubmitForm(handleSubmit);
  }, [onSubmitForm, handleSubmit]);

  return (
    <div className="space-y-6">
      {/* Header do Produto */}
      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <div className="flex items-start gap-3">
          <Package className="size-5 text-primary" />
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">{product.name}</h3>
            <div className="mt-1 flex items-center gap-2">
              {product.sku && (
                <Badge variant="outline" className="text-xs">
                  SKU: {product.sku}
                </Badge>
              )}
              <Badge variant="secondary" className="text-xs">
                Custo: {formatarMoeda(product.cost_unit)}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Informações do Anúncio */}
      <div className="space-y-4">
        <h3 className="border-b border-border pb-2 text-lg font-semibold text-foreground">
          Detalhes do Anúncio
        </h3>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="title" className="text-sm font-medium">
              Título do Anúncio *
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="Digite o título do anúncio..."
              className={cn(
                "mt-1",
                errors.title ? "border-destructive focus-visible:ring-destructive" : ""
              )}
              disabled={isLoading}
              maxLength={60}
            />
            <div className="mt-1 flex items-center justify-between">
              {errors.title && (
                <div className="flex items-center gap-1 text-sm text-destructive">
                  <AlertCircle className="size-3" />
                  {errors.title}
                </div>
              )}
              <span className="text-xs text-muted-foreground">
                {formData.title.length}/60
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="price" className="text-sm font-medium">
                Preço de Venda (R$) *
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) =>
                  handleInputChange("price", parseFloat(e.target.value) || 0)
                }
                placeholder="0,00"
                className={cn(
                  "mt-1",
                  errors.price ? "border-destructive focus-visible:ring-destructive" : ""
                )}
                disabled={isLoading}
              />
              {errors.price && (
                <div className="mt-1 flex items-center gap-1 text-sm text-destructive">
                  <AlertCircle className="size-3" />
                  {errors.price}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="available_quantity" className="text-sm font-medium">
                Quantidade Disponível *
              </Label>
              <Input
                id="available_quantity"
                type="number"
                min="1"
                value={formData.available_quantity}
                onChange={(e) =>
                  handleInputChange("available_quantity", parseInt(e.target.value) || 1)
                }
                placeholder="1"
                className={cn(
                  "mt-1",
                  errors.available_quantity ? "border-destructive focus-visible:ring-destructive" : ""
                )}
                disabled={isLoading}
              />
              {errors.available_quantity && (
                <div className="mt-1 flex items-center gap-1 text-sm text-destructive">
                  <AlertCircle className="size-3" />
                  {errors.available_quantity}
                </div>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="description" className="text-sm font-medium">
              Descrição do Produto
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Descreva os detalhes do produto..."
              className="mt-1 min-h-[100px]"
              disabled={isLoading}
            />
          </div>
        </div>
      </div>

      {/* Configurações Avançadas */}
      <CollapsibleCard
        title="Configurações Avançadas"
        icon={<Tag className="size-4" />}
        isOpen={advancedFields.isOpen}
        onToggle={advancedFields.toggle}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="listing_type" className="text-sm font-medium">
                Tipo de Anúncio
              </Label>
              <Select
                value={formData.listing_type}
                onValueChange={(value) => handleInputChange("listing_type", value)}
                disabled={isLoading}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gold_special">Clássico</SelectItem>
                  <SelectItem value="gold_pro">Premium</SelectItem>
                  <SelectItem value="free">Gratuito</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="condition" className="text-sm font-medium">
                Condição do Produto
              </Label>
              <Select
                value={formData.condition}
                onValueChange={(value) => handleInputChange("condition", value)}
                disabled={isLoading}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">Novo</SelectItem>
                  <SelectItem value="used">Usado</SelectItem>
                  <SelectItem value="not_specified">Não especificado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CollapsibleCard>

      {/* Informações de Custo */}
      {formData.price > 0 && (
        <div className="rounded-lg border border-border/30 bg-muted/10 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Info className="size-4 text-primary" />
            <span className="text-sm font-medium">Resumo Financeiro</span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Preço de Venda:</span>
              <span className="font-mono">{formatarMoeda(formData.price)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Custo do Produto:</span>
              <span className="font-mono">{formatarMoeda(product.cost_unit)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2 font-semibold">
              <span>Margem Bruta:</span>
              <span className={cn(
                "font-mono",
                formData.price - product.cost_unit > 0 ? "text-green-600" : "text-red-600"
              )}>
                {formatarMoeda(formData.price - product.cost_unit)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}