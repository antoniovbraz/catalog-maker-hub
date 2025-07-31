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
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Sale {
  id: string;
  product_id: string;
  marketplace_id: string;
  price_charged: number;
  quantity: number;
  sold_at: string;
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

export const SalesForm = () => {
  const [formData, setFormData] = useState({
    product_id: "",
    marketplace_id: "",
    price_charged: "",
    quantity: "1",
    sold_at: new Date().toISOString().slice(0, 16) // Current datetime for datetime-local input
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

  const { data: sales = [], isLoading } = useQuery({
    queryKey: ["sales"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales")
        .select(`
          *,
          products (name),
          marketplaces (name)
        `)
        .order("sold_at", { ascending: false });
      
      if (error) throw error;
      return data as Sale[];
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from("sales")
        .insert([{
          product_id: data.product_id,
          marketplace_id: data.marketplace_id,
          price_charged: parseFloat(data.price_charged),
          quantity: parseInt(data.quantity),
          sold_at: new Date(data.sold_at).toISOString()
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      setFormData({
        product_id: "",
        marketplace_id: "",
        price_charged: "",
        quantity: "1",
        sold_at: new Date().toISOString().slice(0, 16)
      });
      toast({ title: "Venda registrada com sucesso!" });
    },
    onError: (error) => {
      toast({ title: "Erro ao registrar venda", description: error.message, variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase
        .from("sales")
        .update({
          product_id: data.product_id,
          marketplace_id: data.marketplace_id,
          price_charged: parseFloat(data.price_charged),
          quantity: parseInt(data.quantity),
          sold_at: new Date(data.sold_at).toISOString()
        })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      setFormData({
        product_id: "",
        marketplace_id: "",
        price_charged: "",
        quantity: "1",
        sold_at: new Date().toISOString().slice(0, 16)
      });
      setEditingId(null);
      toast({ title: "Venda atualizada com sucesso!" });
    },
    onError: (error) => {
      toast({ title: "Erro ao atualizar venda", description: error.message, variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("sales")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      toast({ title: "Venda excluída com sucesso!" });
    },
    onError: (error) => {
      toast({ title: "Erro ao excluir venda", description: error.message, variant: "destructive" });
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

  const handleEdit = (sale: Sale) => {
    setFormData({
      product_id: sale.product_id,
      marketplace_id: sale.marketplace_id,
      price_charged: sale.price_charged.toString(),
      quantity: sale.quantity.toString(),
      sold_at: new Date(sale.sold_at).toISOString().slice(0, 16)
    });
    setEditingId(sale.id);
  };

  const handleCancelEdit = () => {
    setFormData({
      product_id: "",
      marketplace_id: "",
      price_charged: "",
      quantity: "1",
      sold_at: new Date().toISOString().slice(0, 16)
    });
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Editar Venda" : "Nova Venda"}</CardTitle>
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
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="price_charged">Preço Cobrado (R$) *</Label>
                <Input
                  id="price_charged"
                  type="number"
                  step="0.01"
                  value={formData.price_charged}
                  onChange={(e) => setFormData(prev => ({ ...prev, price_charged: e.target.value }))}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="quantity">Quantidade *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="sold_at">Data/Hora da Venda *</Label>
                <Input
                  id="sold_at"
                  type="datetime-local"
                  value={formData.sold_at}
                  onChange={(e) => setFormData(prev => ({ ...prev, sold_at: e.target.value }))}
                  required
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingId ? "Atualizar" : "Registrar"}
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
          <CardTitle>Vendas Registradas</CardTitle>
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
                  <TableHead>Preço</TableHead>
                  <TableHead>Qtd</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium">{sale.products?.name}</TableCell>
                    <TableCell>{sale.marketplaces?.name}</TableCell>
                    <TableCell>R$ {sale.price_charged.toFixed(2)}</TableCell>
                    <TableCell>{sale.quantity}</TableCell>
                    <TableCell>R$ {(sale.price_charged * sale.quantity).toFixed(2)}</TableCell>
                    <TableCell>
                      {format(new Date(sale.sold_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(sale)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteMutation.mutate(sale.id)}
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