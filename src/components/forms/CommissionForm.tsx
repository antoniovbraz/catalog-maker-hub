import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Edit } from "lucide-react";
import { useMarketplaces } from "@/hooks/useMarketplaces";
import { useCategories } from "@/hooks/useCategories";
import { formatarPercentual } from "@/utils/pricing";

import { CommissionFormData } from "@/types/commissions";
import { useCommissionsWithDetails, useCreateCommission, useUpdateCommission, useDeleteCommission } from "@/hooks/useCommissions";

export const CommissionForm = () => {
  const [formData, setFormData] = useState<CommissionFormData>({
    marketplace_id: "",
    category_id: "",
    rate: 0
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: marketplaces = [] } = useMarketplaces();
  const { data: categories = [] } = useCategories();
  
  const { data: commissions = [], isLoading } = useCommissionsWithDetails();
  const createMutation = useCreateCommission();
  const updateMutation = useUpdateCommission();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
    
    if (!updateMutation.isError && !createMutation.isError) {
      resetForm();
    }
  };

  const resetForm = () => {
    setFormData({
      marketplace_id: "",
      category_id: "",
      rate: 0
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
              
              <div>
                <Label htmlFor="category">Categoria</Label>
                <Select 
                  value={formData.category_id} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria (ou deixe vazio para padrão)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Padrão (todas as categorias)</SelectItem>
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
              <Label htmlFor="rate">Taxa de Comissão (%)</Label>
              <Input
                id="rate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.rate}
                onChange={(e) => setFormData(prev => ({ ...prev, rate: parseFloat(e.target.value) || 0 }))}
                placeholder="Ex: 13.5 para 13.5%"
                required
              />
            </div>
            
            <div className="flex gap-2">
              <Button type="submit">
                {editingId ? "Atualizar" : "Criar"}
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
          <CardTitle>Comissões Cadastradas</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Carregando...</div>
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
                    <TableCell>{commission.marketplaces?.name}</TableCell>
                    <TableCell>{commission.categories?.name || 'Padrão'}</TableCell>
                    <TableCell>{formatarPercentual(commission.rate)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 className="w-4 h-4" />
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