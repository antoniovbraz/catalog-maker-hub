import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit, ChevronRight } from '@/components/ui/icons';
import { useMarketplacesHierarchical, useMarketplaceParents, useCreateMarketplace, useUpdateMarketplace, useDeleteMarketplace } from "@/hooks/useMarketplaces";
import { MarketplaceType, MarketplaceFormData } from "@/types/marketplaces";
import { MarketplaceTooltip } from "@/components/common/MarketplaceTooltip";

export const MarketplaceForm = () => {
  const [formData, setFormData] = useState<MarketplaceFormData>({
    name: "",
    description: "",
    url: "",
    parent_marketplace_id: null
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: hierarchicalMarketplaces = [], isLoading } = useMarketplacesHierarchical();
  const { data: parentMarketplaces = [] } = useMarketplaceParents();
  const createMutation = useCreateMarketplace();
  const updateMutation = useUpdateMarketplace();
  const deleteMutation = useDeleteMarketplace();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData }, {
        onSuccess: () => {
          setFormData({ name: "", description: "", url: "", parent_marketplace_id: null });
          setEditingId(null);
        }
      });
    } else {
      createMutation.mutate(formData, {
        onSuccess: () => {
          setFormData({ name: "", description: "", url: "", parent_marketplace_id: null });
        }
      });
    }
  };

  const handleEdit = (marketplace: MarketplaceType) => {
    setFormData({
      name: marketplace.name,
      description: marketplace.description || "",
      url: marketplace.url || "",
      parent_marketplace_id: marketplace.parent_marketplace_id || null
    });
    setEditingId(marketplace.id);
  };

  const handleCancelEdit = () => {
    setFormData({ name: "", description: "", url: "", parent_marketplace_id: null });
    setEditingId(null);
  };

  return (
    <div className="space-y-lg">
      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Editar Marketplace" : "Novo Marketplace"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-md">
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

            <div>
              <Label htmlFor="parent">Marketplace Pai (opcional)</Label>
              <Select
                value={formData.parent_marketplace_id || "none"}
                onValueChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  parent_marketplace_id: value === "none" ? null : value 
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um marketplace pai" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum (marketplace independente)</SelectItem>
                  {parentMarketplaces.map((parent) => (
                    <SelectItem key={parent.id} value={parent.id}>
                      {parent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            <div className="space-y-md">
              {hierarchicalMarketplaces.map((hierarchy) => (
                <div key={hierarchy.parent.id} className="border rounded-lg p-md">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{hierarchy.parent.name}</h3>
                      <MarketplaceTooltip 
                        marketplaceName={hierarchy.parent.name} 
                        metadata={hierarchy.parent.marketplace_metadata as Record<string, any>} 
                      />
                      {hierarchy.children.length > 0 && (
                        <Badge variant="secondary">{hierarchy.children.length} modalidades</Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(hierarchy.parent)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteMutation.mutate(hierarchy.parent.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3">
                    {hierarchy.parent.description}
                  </p>
                  
                  {hierarchy.children.length > 0 && (
                    <div className="ml-4 space-y-sm">
                      {hierarchy.children.map((child) => (
                        <div key={child.id} className="flex items-center justify-between p-3 bg-muted rounded-md">
                          <div className="flex items-center gap-2">
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{child.name}</span>
                            <MarketplaceTooltip 
                              marketplaceName={child.name} 
                              metadata={child.marketplace_metadata as Record<string, any>} 
                            />
                            <span className="text-sm text-muted-foreground">
                              {child.description}
                            </span>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(child)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteMutation.mutate(child.id)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};