import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Edit, Info } from "lucide-react";
import { useMarketplaces } from "@/hooks/useMarketplaces";
import { useCategories } from "@/hooks/useCategories";
import { formatarPercentual } from "@/utils/pricing";

import { CommissionFormData, CommissionWithDetails } from "@/types/commissions";
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
  const deleteMutation = useDeleteCommission();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Converter "default" para null e percentual para decimal antes de enviar
    const dataToSubmit = {
      ...formData,
      category_id: formData.category_id === "default" ? null : formData.category_id || null,
      rate: formData.rate / 100 // Converter percentual (14) para decimal (0.14)
    };
    
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: dataToSubmit });
    } else {
      createMutation.mutate(dataToSubmit);
    }
  };

  const handleEdit = (commission: CommissionWithDetails) => {
    setFormData({
      marketplace_id: commission.marketplace_id,
      category_id: commission.category_id || "default",
      rate: commission.rate * 100 // Converter de decimal para percentual na interface
    });
    setEditingId(commission.id);
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
              <div className="flex items-center gap-2">
                <Label htmlFor="rate">Taxa de Comissão (%)</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-4 h-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Digite o valor em percentual. Ex: 14 para 14%</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                id="rate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.rate}
                onChange={(e) => setFormData(prev => ({ ...prev, rate: parseFloat(e.target.value) || 0 }))}
                placeholder="Ex: 14 para 14%"
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
                    <TableCell>{formatarPercentual(commission.rate * 100)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleEdit(commission)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => deleteMutation.mutate(commission.id)}
                          disabled={deleteMutation.isPending}
                        >
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