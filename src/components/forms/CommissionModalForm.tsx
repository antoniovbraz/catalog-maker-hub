import { useCallback, useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calculator } from "@/components/ui/icons";
import { useMarketplaces } from "@/hooks/useMarketplaces";
import { useCategories } from "@/hooks/useCategories";
import { useCreateCommission, useUpdateCommission } from "@/hooks/useCommissions";
import { CommissionFormData, CommissionWithDetails } from "@/types/commissions";

interface CommissionModalFormProps {
  commission?: CommissionWithDetails;
  onSuccess: () => void;
  onSubmitForm: (submitFn: () => Promise<void>) => void;
}

export function CommissionModalForm({ commission, onSuccess, onSubmitForm }: CommissionModalFormProps) {
  const isEdit = !!commission;
  const { data: marketplaces = [] } = useMarketplaces();
  const { data: categories = [] } = useCategories();
  const createMutation = useCreateCommission();
  const updateMutation = useUpdateCommission();

  const [formData, setFormData] = useState<CommissionFormData>({
    marketplace_id: "",
    category_id: "",
    rate: 0,
  });

  useEffect(() => {
    if (commission) {
      setFormData({
        marketplace_id: commission.marketplace_id,
        category_id: commission.category_id || "default",
        rate: commission.rate * 100,
      });
    } else {
      setFormData({ marketplace_id: "", category_id: "", rate: 0 });
    }
  }, [commission]);

  const handleInputChange = (field: keyof CommissionFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const onSubmit = useCallback(async () => {
    const dataToSubmit = {
      marketplace_id: formData.marketplace_id,
      category_id:
        formData.category_id === "default" || formData.category_id === ""
          ? null
          : formData.category_id,
      rate: formData.rate / 100,
    };

    if (isEdit && commission) {
      await updateMutation.mutateAsync({ id: commission.id, data: dataToSubmit });
    } else {
      await createMutation.mutateAsync(dataToSubmit);
    }
    onSuccess();
  }, [commission, createMutation, updateMutation, formData, isEdit, onSuccess]);

  const handleSubmit = useCallback(async () => {
    await onSubmit();
  }, [onSubmit]);

  useEffect(() => {
    onSubmitForm(handleSubmit);
  }, [onSubmitForm, handleSubmit]);

  const getImpactPreview = (rate: number) => {
    if (rate === 0) return null;

    let color = "text-green-600";
    let label = "Baixo impacto";
    let bgColor = "bg-green-50 border-green-200";

    if (rate > 8 && rate <= 15) {
      color = "text-yellow-600";
      label = "Impacto moderado";
      bgColor = "bg-yellow-50 border-yellow-200";
    } else if (rate > 15) {
      color = "text-red-600";
      label = "Alto impacto";
      bgColor = "bg-red-50 border-red-200";
    }

    return (
      <div className={`text-sm ${color} mt-2 rounded-md border p-2 ${bgColor} flex items-center gap-2`}>
        <Calculator className="size-4" />
        <span>{label} no preço final</span>
        <Badge variant="outline" className="ml-auto text-xs">
          {rate.toFixed(1)}%
        </Badge>
      </div>
    );
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="marketplace">Marketplace *</Label>
        <Select
          value={formData.marketplace_id}
          onValueChange={(value) => handleInputChange("marketplace_id", value)}
          disabled={isLoading}
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

      <div className="space-y-2">
        <Label htmlFor="category">Categoria</Label>
        <Select
          value={formData.category_id}
          onValueChange={(value) => handleInputChange("category_id", value)}
          disabled={isLoading}
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
        <p className="mt-1 text-xs text-muted-foreground">
          Comissões específicas por categoria têm prioridade sobre a padrão
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="rate" className="font-medium">
          Taxa de Comissão (%) *
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            Valor em percentual
          </span>
        </Label>
        <div className="relative">
          <Input
            id="rate"
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={formData.rate}
            onChange={(e) =>
              handleInputChange("rate", parseFloat(e.target.value) || 0)
            }
            placeholder="Ex: 14"
            className="pr-10"
            required
            disabled={isLoading}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
            %
          </div>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <p className="text-xs text-muted-foreground">
            💡 Digite apenas o número (exemplo: <strong>14</strong> para 14%)
          </p>
        </div>
        {getImpactPreview(formData.rate)}
      </div>
    </div>
  );
}
