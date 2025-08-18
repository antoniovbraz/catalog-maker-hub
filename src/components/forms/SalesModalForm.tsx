import { useCallback, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProducts } from "@/hooks/useProducts";
import { useMarketplaces } from "@/hooks/useMarketplaces";
import { useCreateSale, useUpdateSale } from "@/hooks/useSales";
import type { SaleWithDetails, SaleFormData } from "@/types/sales";

interface SalesModalFormProps {
  sale?: SaleWithDetails;
  onSuccess: () => void;
  onSubmitForm: (submitFn: () => Promise<void>) => void;
}

export function SalesModalForm({ sale, onSuccess, onSubmitForm }: SalesModalFormProps) {
  const { data: products = [] } = useProducts();
  const { data: marketplaces = [] } = useMarketplaces();
  const createMutation = useCreateSale();
  const updateMutation = useUpdateSale();

  const [formData, setFormData] = useState<SaleFormData>({
    product_id: "",
    marketplace_id: "",
    price_charged: 0,
    quantity: 1,
    sold_at: new Date().toISOString(),
  });

  useEffect(() => {
    if (sale) {
      setFormData({
        product_id: sale.product_id || "",
        marketplace_id: sale.marketplace_id || "",
        price_charged: sale.price_charged,
        quantity: sale.quantity,
        sold_at: sale.sold_at,
      });
    } else {
      setFormData({
        product_id: "",
        marketplace_id: "",
        price_charged: 0,
        quantity: 1,
        sold_at: new Date().toISOString(),
      });
    }
  }, [sale]);

  const resetForm = () => {
    setFormData({
      product_id: "",
      marketplace_id: "",
      price_charged: 0,
      quantity: 1,
      sold_at: new Date().toISOString(),
    });
  };

  const handleSubmit = useCallback(async () => {
    if (sale) {
      await updateMutation.mutateAsync({ id: sale.id, data: formData });
    } else {
      await createMutation.mutateAsync(formData);
    }
    resetForm();
    onSuccess();
  }, [sale, formData, onSuccess, createMutation, updateMutation]);

  useEffect(() => {
    onSubmitForm(handleSubmit);
  }, [onSubmitForm, handleSubmit]);

  const formatDateForInput = (isoDate: string) => {
    return new Date(isoDate).toISOString().slice(0, 16);
  };

  const formatDateFromInput = (dateString: string) => {
    return new Date(dateString).toISOString();
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-md">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="product">Produto *</Label>
          <Select
            value={formData.product_id}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, product_id: value }))
            }
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um produto" />
            </SelectTrigger>
            <SelectContent>
              {products.map((product) => (
                <SelectItem key={product.id} value={product.id}>
                  {product.name} {product.sku ? `(${product.sku})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="marketplace">Marketplace *</Label>
          <Select
            value={formData.marketplace_id}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, marketplace_id: value }))
            }
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
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <Label htmlFor="price_charged">Preço Cobrado (R$) *</Label>
          <Input
            id="price_charged"
            type="number"
            step="0.01"
            value={formData.price_charged}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                price_charged: parseFloat(e.target.value) || 0,
              }))
            }
            required
            disabled={isLoading}
          />
        </div>

        <div>
          <Label htmlFor="quantity">Quantidade *</Label>
          <Input
            id="quantity"
            type="number"
            min="1"
            value={formData.quantity}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                quantity: parseInt(e.target.value) || 1,
              }))
            }
            required
            disabled={isLoading}
          />
        </div>

        <div>
          <Label htmlFor="sold_at">Data/Hora da Venda *</Label>
          <Input
            id="sold_at"
            type="datetime-local"
            value={formatDateForInput(formData.sold_at)}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                sold_at: formatDateFromInput(e.target.value),
              }))
            }
            required
            disabled={isLoading}
          />
        </div>
      </div>
    </div>
  );
}

