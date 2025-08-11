import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { Trash2, Edit } from '@/components/ui/icons';
import { handleSupabaseError } from "@/utils/errors";

interface ShippingRule {
  id: string;
  product_id: string;
  marketplace_id: string;
  shipping_cost: number;
  free_shipping_threshold: number;
  created_at: string;
  updated_at: string;
  products?: {
    name: string;
  };
  marketplaces?: {
    name: string;
  };
}

interface Product {
  id: string;
  name: string;
}

interface Marketplace {
  id: string;
  name: string;
}

interface ShippingRuleFormProps {
  onCancel?: () => void;
}

export const ShippingRuleForm = ({ onCancel }: ShippingRuleFormProps) => {
  interface ShippingRuleFormData {
    product_id: string;
    marketplace_id: string;
    shipping_cost: string;
    free_shipping_threshold: string;
  }

  const [formData, setFormData] = useState<ShippingRuleFormData>({
    product_id: "",
    marketplace_id: "",
    shipping_cost: "",
    free_shipping_threshold: ""
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name")
        .order("name");
      
      if (error) throw error;
      return data as Product[];
    }
  });

  const { data: marketplaces = [] } = useQuery({
    queryKey: ["marketplaces"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketplaces")
        .select("id, name")
        .order("name");
      
      if (error) throw error;
      return data as Marketplace[];
    }
  });

  const { data: shippingRules = [], isLoading } = useQuery({
    queryKey: ["shipping_rules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shipping_rules")
        .select(`
          *,
          products (name),
          marketplaces (name)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as ShippingRule[];
    }
  });

  const upsertMutation = useMutation({
    mutationFn: async (data: ShippingRuleFormData & { id?: string }) => {
      const { error } = await supabase
        .from("shipping_rules")
        .upsert({
          ...data,
          shipping_cost: parseFloat(data.shipping_cost),
          free_shipping_threshold: parseFloat(data.free_shipping_threshold || "0")
        }, {
          onConflict: 'product_id,marketplace_id',
          ignoreDuplicates: false
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipping_rules"] });
      resetForm();
      toast({ 
        title: editingId ? "Regra de frete atualizada com sucesso!" : "Regra de frete criada com sucesso!" 
      });
    },
    onError: (error) => {
      const friendlyMessage = handleSupabaseError(error);
      toast({ 
        title: "Erro ao salvar regra de frete", 
        description: friendlyMessage, 
        variant: "destructive" 
      });
    }
  });

  const resetForm = () => {
    setFormData({
      product_id: "",
      marketplace_id: "",
      shipping_cost: "",
      free_shipping_threshold: ""
    });
    setEditingId(null);
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("shipping_rules")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipping_rules"] });
      toast({ title: "Regra de frete excluída com sucesso!" });
    },
    onError: (error) => {
      const friendlyMessage = handleSupabaseError(error);
      toast({ 
        title: "Erro ao excluir regra de frete", 
        description: friendlyMessage, 
        variant: "destructive" 
      });
    }
  });

  // Detectar automaticamente se uma regra já existe para produto + marketplace
  useEffect(() => {
    if (formData.product_id && formData.marketplace_id) {
      const existingRule = shippingRules.find(rule => 
        rule.product_id === formData.product_id && 
        rule.marketplace_id === formData.marketplace_id
      );
      
      if (existingRule && !editingId) {
        // Regra existe e não estamos em modo de edição - mudar para edição
        setFormData({
          product_id: existingRule.product_id,
          marketplace_id: existingRule.marketplace_id,
          shipping_cost: existingRule.shipping_cost.toString(),
          free_shipping_threshold: existingRule.free_shipping_threshold.toString()
        });
        setEditingId(existingRule.id);
        toast({ 
          title: "Regra encontrada", 
          description: "Esta combinação já existe. Modo de edição ativado.",
          variant: "default"
        });
      } else if (!existingRule && editingId) {
        // Não existe regra e estamos em modo de edição - voltar para criação
        setEditingId(null);
        setFormData({
          product_id: formData.product_id,
          marketplace_id: formData.marketplace_id,
          shipping_cost: "",
          free_shipping_threshold: ""
        });
        toast({ 
          title: "Nova combinação", 
          description: "Modo de criação ativado para esta nova combinação.",
          variant: "default"
        });
      }
    } else if (editingId && (!formData.product_id || !formData.marketplace_id)) {
      // Se está em modo de edição mas não tem produto ou marketplace selecionado, resetar
      setEditingId(null);
    }
  }, [formData.product_id, formData.marketplace_id, shippingRules, editingId, toast]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const dataToSave = editingId ? { id: editingId, ...formData } : formData;
    upsertMutation.mutate(dataToSave);
  };

  const handleEdit = (rule: ShippingRule) => {
    setFormData({
      product_id: rule.product_id,
      marketplace_id: rule.marketplace_id,
      shipping_cost: rule.shipping_cost.toString(),
      free_shipping_threshold: rule.free_shipping_threshold.toString()
    });
    setEditingId(rule.id);
  };

  const handleCancelEdit = () => {
    resetForm();
  };

  return (
    <div className="space-y-lg">
      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Editar Regra de Frete" : "Nova Regra de Frete"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-md">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="product">Produto *</Label>
                <Select value={formData.product_id} onValueChange={(value) => setFormData(prev => ({ ...prev, product_id: value }))}>
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
                <Select value={formData.marketplace_id} onValueChange={(value) => setFormData(prev => ({ ...prev, marketplace_id: value }))}>
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="shipping_cost">Custo do Frete (R$) *</Label>
                <Input
                  id="shipping_cost"
                  type="number"
                  step="0.01"
                  value={formData.shipping_cost}
                  onChange={(e) => setFormData(prev => ({ ...prev, shipping_cost: e.target.value }))}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="free_shipping_threshold">Frete Grátis a partir de (R$)</Label>
                <Input
                  id="free_shipping_threshold"
                  type="number"
                  step="0.01"
                  value={formData.free_shipping_threshold}
                  onChange={(e) => setFormData(prev => ({ ...prev, free_shipping_threshold: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={upsertMutation.isPending}>
                {editingId ? "Atualizar" : "Criar"}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel || handleCancelEdit}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

    </div>
  );
};