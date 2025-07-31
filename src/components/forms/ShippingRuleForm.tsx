import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Edit } from "lucide-react";

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

export const ShippingRuleForm = () => {
  const [formData, setFormData] = useState({
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

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from("shipping_rules")
        .insert([{
          ...data,
          shipping_cost: parseFloat(data.shipping_cost),
          free_shipping_threshold: parseFloat(data.free_shipping_threshold || "0")
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipping_rules"] });
      setFormData({
        product_id: "",
        marketplace_id: "",
        shipping_cost: "",
        free_shipping_threshold: ""
      });
      toast({ title: "Regra de frete criada com sucesso!" });
    },
    onError: (error) => {
      toast({ title: "Erro ao criar regra de frete", description: error.message, variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase
        .from("shipping_rules")
        .update({
          ...data,
          shipping_cost: parseFloat(data.shipping_cost),
          free_shipping_threshold: parseFloat(data.free_shipping_threshold || "0")
        })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipping_rules"] });
      setFormData({
        product_id: "",
        marketplace_id: "",
        shipping_cost: "",
        free_shipping_threshold: ""
      });
      setEditingId(null);
      toast({ title: "Regra de frete atualizada com sucesso!" });
    },
    onError: (error) => {
      toast({ title: "Erro ao atualizar regra de frete", description: error.message, variant: "destructive" });
    }
  });

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
      toast({ title: "Erro ao excluir regra de frete", description: error.message, variant: "destructive" });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
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
    setFormData({
      product_id: "",
      marketplace_id: "",
      shipping_cost: "",
      free_shipping_threshold: ""
    });
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Editar Regra de Frete" : "Nova Regra de Frete"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
            
            <div className="flex gap-2">
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingId ? "Atualizar" : "Criar"}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={handleCancelEdit}>
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Regras de Frete Cadastradas</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Carregando...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Marketplace</TableHead>
                  <TableHead>Custo Frete</TableHead>
                  <TableHead>Frete Grátis</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shippingRules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium">{rule.products?.name}</TableCell>
                    <TableCell>{rule.marketplaces?.name}</TableCell>
                    <TableCell>R$ {rule.shipping_cost.toFixed(2)}</TableCell>
                    <TableCell>
                      {rule.free_shipping_threshold > 0 
                        ? `A partir de R$ ${rule.free_shipping_threshold.toFixed(2)}`
                        : "Não disponível"
                      }
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(rule)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteMutation.mutate(rule.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};