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

// TODO: Criar hooks e types para commissions quando necessário
interface Commission {
  id: string;
  marketplace_id: string;
  category_id: string | null;
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

interface CommissionFormData {
  marketplace_id: string;
  category_id: string;
  rate: number;
}

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
  
  // TODO: Implementar hooks específicos para commissions
  // Por enquanto, mantendo a lógica básica para demonstrar a estrutura

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implementar lógica de criação/atualização usando hooks
    toast({ title: "Funcionalidade em desenvolvimento" });
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
          <div className="text-center text-muted-foreground py-8">
            Implementação dos hooks de comissões pendente.<br/>
            Use a aba Comissões do sistema antigo por enquanto.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};