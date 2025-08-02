import { useState, useEffect } from "react";
import { Truck, Calculator, Settings, Plus, Eye, Edit, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SmartForm } from "@/components/ui/smart-form";
import { DataVisualization } from "@/components/ui/data-visualization";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { shippingRulesService } from "@/services/shipping-rules";
import { handleSupabaseError } from "@/utils/errors";

interface ShippingRule {
  id: string;
  product_id: string;
  marketplace_id: string;
  shipping_cost: number;
  free_shipping_threshold?: number;
  created_at?: string;
  updated_at?: string;
  products: { name: string };
  marketplaces: { name: string };
}

function ShippingRuleForm() {
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
      return data as { id: string; name: string }[];
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
      return data as { id: string; name: string }[];
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
        variant: "destructive",
      });
    }
  });

  useEffect(() => {
    if (formData.product_id && formData.marketplace_id) {
      const existingRule = shippingRules.find(rule =>
        rule.product_id === formData.product_id &&
        rule.marketplace_id === formData.marketplace_id
      );

      if (existingRule && !editingId) {
        setFormData({
          product_id: existingRule.product_id,
          marketplace_id: existingRule.marketplace_id,
          shipping_cost: existingRule.shipping_cost.toString(),
          free_shipping_threshold: existingRule.free_shipping_threshold?.toString() || ""
        });
        setEditingId(existingRule.id);
        toast({
          title: "Regra encontrada",
          description: "Esta combinação já existe. Modo de edição ativado.",
          variant: "default"
        });
      } else if (!existingRule && editingId) {
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
    }
  }, [formData.product_id, formData.marketplace_id, editingId, shippingRules, toast]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Editar Regra de Frete" : "Nova Regra de Frete"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={(e) => {
            e.preventDefault();
            upsertMutation.mutate({ ...formData, id: editingId || undefined });
          }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="product">Produto *</Label>
                <Select
                  value={formData.product_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, product_id: value }))}
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
                  onValueChange={(value) => setFormData(prev => ({ ...prev, marketplace_id: value }))}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="shipping_cost">Custo de Frete *</Label>
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
                <Label htmlFor="free_shipping_threshold">Frete Grátis a partir de</Label>
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
              <Button type="submit" disabled={upsertMutation.isPending}>
                {editingId ? "Atualizar" : "Salvar"}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Regras de Frete</CardTitle>
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
                  <TableHead>Custo</TableHead>
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
                    <TableCell>{rule.free_shipping_threshold ? `R$ ${rule.free_shipping_threshold.toFixed(2)}` : '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setFormData({
                              product_id: rule.product_id,
                              marketplace_id: rule.marketplace_id,
                              shipping_cost: rule.shipping_cost.toString(),
                              free_shipping_threshold: rule.free_shipping_threshold?.toString() || ""
                            });
                            setEditingId(rule.id);
                          }}
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
}

export function ShippingRuleFormEnhanced() {
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState<ShippingRule | null>(null);
  const { toast } = useToast();

  const { data: shippingRules = [], isLoading, refetch } = useQuery({
    queryKey: ['shipping-rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shipping_rules')
        .select(`
          id,
          product_id,
          marketplace_id,
          shipping_cost,
          products!inner(name),
          marketplaces!inner(name)
        `)
        .order('shipping_cost', { ascending: false });

      if (error) throw error;
      return data as ShippingRule[];
    }
  });

  const getShippingStatus = (cost: number) => {
    if (cost === 0) return "active";
    if (cost <= 10) return "warning";
    return "error";
  };

  const getShippingLabel = (cost: number) => {
    if (cost === 0) return "Grátis";
    return `R$ ${cost.toFixed(2)}`;
  };

  const columns = [
    {
      key: "products.name",
      header: "Produto",
      sortable: true,
      render: (item: ShippingRule) => item.products.name
    },
    {
      key: "marketplaces.name",
      header: "Marketplace",
      sortable: true,
      render: (item: ShippingRule) => item.marketplaces.name
    },
    {
      key: "shipping_cost",
      header: "Custo de Frete",
      sortable: true,
      render: (item: ShippingRule) => (
        <StatusBadge 
          status={getShippingStatus(item.shipping_cost)} 
          label={getShippingLabel(item.shipping_cost)}
        />
      )
    }
  ];

  const actions = [
    {
      label: "Editar",
      icon: <Edit className="w-4 h-4" />,
      onClick: (rule: ShippingRule) => {
        setEditingRule(rule);
        setShowForm(true);
      },
      variant: "outline" as const
    },
    {
      label: "Excluir",
      icon: <Trash2 className="w-4 h-4" />,
      onClick: async (rule: ShippingRule) => {
        try {
          await shippingRulesService.delete(rule.id);
          toast({
            title: "Sucesso",
            description: "Regra de frete excluída com sucesso!",
          });
          await refetch();
        } catch (error) {
          const message = error instanceof Error ? error.message : "Erro ao excluir regra";
          toast({
            title: "Erro",
            description: message,
            variant: "destructive",
          });
        }
      },
      variant: "destructive" as const
    }
  ];

  const formSections = showForm ? [
    {
      id: "regra",
      title: editingRule ? "Editar Regra de Frete" : "Nova Regra de Frete",
      description: "Configure os custos de frete por produto e marketplace",
      icon: <Truck className="h-5 w-5" />,
      children: (
        <ShippingRuleForm />
      )
    }
  ] : [
    {
      id: "regras",
      title: "Regras de Frete Configuradas",
      description: "Gerenciar regras de frete personalizadas por produto e marketplace",
      icon: <Eye className="h-5 w-5" />,
      children: (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Regra
            </Button>
          </div>
          
          <DataVisualization
            title="Regras de Frete"
            data={shippingRules.map(rule => ({ ...rule, id: rule.id }))}
            columns={columns}
            actions={actions}
            searchable={true}
            isLoading={isLoading}
            emptyState={
              <div className="text-center py-8">
                <Truck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">Nenhuma regra de frete configurada ainda</p>
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeira Regra
                </Button>
              </div>
            }
          />
        </div>
      )
    }
  ];

  return (
    <SmartForm
      title="Regras de Frete"
      sections={formSections}
      onCancel={showForm ? () => {
        setShowForm(false);
        setEditingRule(null);
      } : undefined}
    />
  );
}