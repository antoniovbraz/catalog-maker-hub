import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Edit } from "lucide-react";
import { useMarketplaces, useCreateMarketplace, useUpdateMarketplace, useDeleteMarketplace } from "@/hooks/useMarketplaces";
import { MarketplaceType, MarketplaceFormData } from "@/types/marketplaces";

export const MarketplaceForm = () => {
  const [formData, setFormData] = useState<MarketplaceFormData>({
    name: "",
    description: "",
    url: ""
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: marketplaces = [], isLoading } = useMarketplaces();
  const createMutation = useCreateMarketplace();
  const updateMutation = useUpdateMarketplace();
  const deleteMutation = useDeleteMarketplace();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData }, {
        onSuccess: () => {
          setFormData({ name: "", description: "", url: "" });
          setEditingId(null);
        }
      });
    } else {
      createMutation.mutate(formData, {
        onSuccess: () => {
          setFormData({ name: "", description: "", url: "" });
        }
      });
    }
  };

  const handleEdit = (marketplace: MarketplaceType) => {
    setFormData({
      name: marketplace.name,
      description: marketplace.description || "",
      url: marketplace.url || ""
    });
    setEditingId(marketplace.id);
  };

  const handleCancelEdit = () => {
    setFormData({ name: "", description: "", url: "" });
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Editar Marketplace" : "Novo Marketplace"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                type="url"
                value={formData.url}
                onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
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
          <CardTitle>Marketplaces Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Carregando...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {marketplaces.map((marketplace) => (
                  <TableRow key={marketplace.id}>
                    <TableCell className="font-medium">{marketplace.name}</TableCell>
                    <TableCell>{marketplace.description}</TableCell>
                    <TableCell>{marketplace.url}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(marketplace)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteMutation.mutate(marketplace.id)}
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