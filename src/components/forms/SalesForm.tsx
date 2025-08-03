import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Edit } from '@/components/ui/icons';
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useSales, useCreateSale, useUpdateSale, useDeleteSale } from "@/hooks/useSales";
import { useProducts } from "@/hooks/useProducts";
import { useMarketplaces } from "@/hooks/useMarketplaces";
import { SaleWithDetails, SaleFormData } from "@/types/sales";
import { formatarMoeda } from "@/utils/pricing";

export const SalesForm = () => {
  const [formData, setFormData] = useState<SaleFormData>({
    product_id: "",
    marketplace_id: "",
    price_charged: 0,
    quantity: 1,
    sold_at: new Date().toISOString()
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: products = [] } = useProducts();
  const { data: marketplaces = [] } = useMarketplaces();
  const { data: sales = [], isLoading } = useSales();
  const createMutation = useCreateSale();
  const updateMutation = useUpdateSale();
  const deleteMutation = useDeleteSale();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData }, {
        onSuccess: () => {
          resetForm();
        }
      });
    } else {
      createMutation.mutate(formData, {
        onSuccess: () => {
          resetForm();
        }
      });
    }
  };

  const resetForm = () => {
    setFormData({
      product_id: "",
      marketplace_id: "",
      price_charged: 0,
      quantity: 1,
      sold_at: new Date().toISOString()
    });
    setEditingId(null);
  };

  const handleEdit = (sale: SaleWithDetails) => {
    setFormData({
      product_id: sale.product_id || "",
      marketplace_id: sale.marketplace_id || "",
      price_charged: sale.price_charged,
      quantity: sale.quantity,
      sold_at: sale.sold_at
    });
    setEditingId(sale.id);
  };

  // Convert ISO date to datetime-local format for input
  const formatDateForInput = (isoDate: string) => {
    return new Date(isoDate).toISOString().slice(0, 16);
  };

  // Convert datetime-local input to ISO string
  const formatDateFromInput = (dateString: string) => {
    return new Date(dateString).toISOString();
  };

  return (
    <div className="space-y-lg">
      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Editar Venda" : "Nova Venda"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-md">
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
                        {product.name} {product.sku ? `(${product.sku})` : ''}
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
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="price_charged">Preço Cobrado (R$) *</Label>
                <Input
                  id="price_charged"
                  type="number"
                  step="0.01"
                  value={formData.price_charged}
                  onChange={(e) => setFormData(prev => ({ ...prev, price_charged: parseFloat(e.target.value) || 0 }))}
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
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="sold_at">Data/Hora da Venda *</Label>
                <Input
                  id="sold_at"
                  type="datetime-local"
                  value={formatDateForInput(formData.sold_at)}
                  onChange={(e) => setFormData(prev => ({ ...prev, sold_at: formatDateFromInput(e.target.value) }))}
                  required
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingId ? "Atualizar" : "Registrar"}
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
                    <TableCell>{formatarMoeda(sale.price_charged)}</TableCell>
                    <TableCell>{sale.quantity}</TableCell>
                    <TableCell>{formatarMoeda(sale.price_charged * sale.quantity)}</TableCell>
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