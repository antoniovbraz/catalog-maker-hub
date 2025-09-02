import { useCallback, useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { handleSupabaseError } from "@/utils/errors";
import { useAuth } from '@/contexts/AuthContext';

interface ShippingRule {
  id: string;
  product_id: string;
  marketplace_id: string;
  shipping_cost: number;
  free_shipping_threshold: number;
}

interface Product {
  id: string;
  name: string;
}

interface Marketplace {
  id: string;
  name: string;
}

interface ShippingRuleModalFormProps {
  rule?: ShippingRule;
  onSuccess: () => void;
  onSubmitForm: (submitFn: () => Promise<void>) => void;
}

interface ShippingRuleFormData {
  product_id: string;
  marketplace_id: string;
  shipping_cost: string;
  free_shipping_threshold: string;
}

export function ShippingRuleModalForm({ rule, onSuccess, onSubmitForm }: ShippingRuleModalFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id;
  const isEdit = !!rule;

  const [formData, setFormData] = useState<ShippingRuleFormData>({
    product_id: rule?.product_id || "",
    marketplace_id: rule?.marketplace_id || "",
    shipping_cost: rule ? rule.shipping_cost.toString() : "",
    free_shipping_threshold: rule ? rule.free_shipping_threshold.toString() : "",
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data as Product[];
    },
    enabled: !!tenantId,
  });

  const { data: marketplaces = [] } = useQuery({
    queryKey: ["marketplaces", tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketplaces")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data as Marketplace[];
    },
    enabled: !!tenantId,
  });

  const upsertMutation = useMutation({
    mutationFn: async (data: ShippingRuleFormData & { id?: string }) => {
      const { error } = await supabase
        .from("shipping_rules")
        .upsert(
          {
            ...data,
            shipping_cost: parseFloat(data.shipping_cost),
            free_shipping_threshold: parseFloat(data.free_shipping_threshold || "0"),
          },
          {
            onConflict: "product_id,marketplace_id",
            ignoreDuplicates: false,
          }
        );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipping_rules", tenantId] });
      toast({
        title: isEdit
          ? "Regra de frete atualizada com sucesso!"
          : "Regra de frete criada com sucesso!",
      });
      onSuccess();
    },
    onError: (error) => {
      const friendlyMessage = handleSupabaseError(error);
      toast({
        title: "Erro ao salvar regra de frete",
        description: friendlyMessage,
        variant: "destructive",
      });
    },
  });

  const onSubmit = useCallback(async () => {
    const dataToSave = rule ? { id: rule.id, ...formData } : formData;
    await upsertMutation.mutateAsync(dataToSave);
  }, [formData, rule, upsertMutation]);

  const handleSubmit = useCallback(async () => {
    await onSubmit();
  }, [onSubmit]);

  useEffect(() => {
    onSubmitForm(handleSubmit);
  }, [onSubmitForm, handleSubmit]);

  const isLoading = upsertMutation.isPending;

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
                  {product.name}
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="shipping_cost">Custo do Frete (R$) *</Label>
          <Input
            id="shipping_cost"
            type="number"
            step="0.01"
            value={formData.shipping_cost}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, shipping_cost: e.target.value }))
            }
            required
            disabled={isLoading}
          />
        </div>

        <div>
          <Label htmlFor="free_shipping_threshold">
            Frete Grátis a partir de (R$)
          </Label>
          <Input
            id="free_shipping_threshold"
            type="number"
            step="0.01"
            value={formData.free_shipping_threshold}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                free_shipping_threshold: e.target.value,
              }))
            }
            disabled={isLoading}
          />
        </div>
      </div>
    </div>
  );
}

export default ShippingRuleModalForm;

