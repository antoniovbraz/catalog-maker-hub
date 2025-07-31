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

interface Commission {
  id: string;
  marketplace_id: string;
  category_id: string;
  rate: number;
  created_at: string;
  updated_at: string;
  marketplaces?: {
    name: string;
  };
  categories?: {
    name: string;
  };
}

interface Marketplace {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
}

export const CommissionForm = () => {
  const [formData, setFormData] = useState({
    marketplace_id: "",
    category_id: "",
    rate: ""
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name")
        .order("name");
      
      if (error) throw error;
      return data as Category[];
    }
  });

  const { data: commissions = [], isLoading } = useQuery({
    queryKey: ["commissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("commissions")
        .select(`
          *,
          marketplaces (name),
          categories (name)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Commission[];
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from("commissions")
        .insert([{
          ...data,
          rate: parseFloat(data.rate) / 100 // Convert percentage to decimal
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commissions"] });
      setFormData({
        marketplace_id: "",
        category_id: "",
        rate: ""
      });
      toast({ title: "Comissão criada com sucesso!" });
    },
    onError: (error) => {
      toast({ title: "Erro ao criar comissão", description: error.message, variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase
        .from("commissions")
        .update({
          ...data,
          rate: parseFloat(data.rate) / 100 // Convert percentage to decimal
        })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commissions"] });
      setFormData({
        marketplace_id: "",
        category_id: "",
        rate: ""
      });
      setEditingId(null);
      toast({ title: "Comissão atualizada com sucesso!" });
    },
    onError: (error) => {
      toast({ title: "Erro ao atualizar comissão", description: error.message, variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("commissions")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commissions"] });
      toast({ title: "Comissão excluída com sucesso!" });
    },
    onError: (error) => {
      toast({ title: "Erro ao excluir comissão", description: error.message, variant: "destructive" });
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

  const handleEdit = (commission: Commission) => {
    setFormData({
      marketplace_id: commission.marketplace_id,
      category_id: commission.category_id,
      rate: (commission.rate * 100).toString() // Convert decimal to percentage
    });
    setEditingId(commission.id);
  };

  const handleCancelEdit = () => {
    setFormData({
      marketplace_id: "",
      category_id: "",
      rate: ""
    });
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Editar Comissão" : "Nova Comissão"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              
              <div>
                <Label htmlFor="category">Categoria *</Label>
                <Select value={formData.category_id} onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="rate">Taxa de Comissão (%) *</Label>
              <Input
                id="rate"
                type="number"
                step="0.01"
                value={formData.rate}
                onChange={(e) => setFormData(prev => ({ ...prev, rate: e.target.value }))}
                placeholder="Ex: 13.5 para 13.5%"
                required
              />
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
          <CardTitle>Comissões Cadastradas</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Carregando...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Marketplace</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Taxa</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissions.map((commission) => (
                  <TableRow key={commission.id}>
                    <TableCell className="font-medium">{commission.marketplaces?.name}</TableCell>
                    <TableCell>{commission.categories?.name}</TableCell>
                    <TableCell>{(commission.rate * 100).toFixed(2)}%</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(commission)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteMutation.mutate(commission.id)}
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