import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Package, ExternalLink, RefreshCw, Play, Loader2 } from "@/components/ui/icons";
import { useMLIntegration, useMLSync } from "@/hooks/useMLIntegration";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";

export function MLProductList() {
  const { sync, syncStatusQuery } = useMLIntegration();
  const { syncProduct, syncBatch } = useMLSync();
  const products = sync?.products || [];
  const isLoading = syncStatusQuery.isLoading;
  
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  const handleSelectProduct = (productId: string, checked: boolean) => {
    if (checked) {
      setSelectedProducts(prev => [...prev, productId]);
    } else {
      setSelectedProducts(prev => prev.filter(id => id !== productId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(products.map(p => p.id));
    } else {
      setSelectedProducts([]);
    }
  };

  const handleSyncProduct = (productId: string) => {
    syncProduct.mutate(productId);
  };

  const handleSyncBatch = () => {
    if (selectedProducts.length > 0) {
      syncBatch.mutate(selectedProducts);
      setSelectedProducts([]);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'synced':
        return <Badge className="bg-success text-success-foreground">Sincronizado</Badge>;
      case 'syncing':
        return <Badge variant="secondary">Sincronizando</Badge>;
      case 'error':
        return <Badge variant="destructive">Erro</Badge>;
      default:
        return <Badge variant="outline">Não Sincronizado</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Package className="size-5" />
            <div>
              <CardTitle>Produtos Sincronizados</CardTitle>
              <CardDescription>
                Gerencie a sincronização dos seus produtos com o Mercado Livre
              </CardDescription>
            </div>
          </div>
          
          {selectedProducts.length > 0 && (
            <Button 
              onClick={handleSyncBatch}
              disabled={syncBatch.isPending}
              size="sm"
            >
              {syncBatch.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Play className="mr-2 size-4" />
              )}
              Sincronizar Selecionados ({selectedProducts.length})
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {products.length === 0 ? (
          <div className="text-center py-8">
            <Package className="mx-auto mb-4 size-12 text-muted-foreground" />
            <h4 className="mb-2 text-lg font-medium">Nenhum produto encontrado</h4>
            <p className="text-muted-foreground">
              Produtos sincronizados aparecerão aqui
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedProducts.length === products.length}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>ID ML</TableHead>
                  <TableHead>Última Sync</TableHead>
                  <TableHead className="w-24">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedProducts.includes(product.id)}
                        onCheckedChange={(checked) => 
                          handleSelectProduct(product.id, checked as boolean)
                        }
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {product.name}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(product.sync_status)}
                    </TableCell>
                    <TableCell>
                      {product.ml_item_id ? (
                        <div className="flex items-center space-x-1">
                          <span className="font-mono text-sm">{product.ml_item_id}</span>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => window.open(
                              `https://www.mercadolivre.com.br/p/${product.ml_item_id}`, 
                              '_blank'
                            )}
                          >
                            <ExternalLink className="size-3" />
                          </Button>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {product.last_sync_at ? (
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(product.last_sync_at), { 
                            addSuffix: true, 
                            locale: ptBR 
                          })}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSyncProduct(product.id)}
                        disabled={syncProduct.isPending}
                      >
                        {syncProduct.isPending ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <RefreshCw className="size-4" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}