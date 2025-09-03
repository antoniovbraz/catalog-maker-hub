import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Package, Play, Loader2 } from "@/components/ui/icons";
import { useMLIntegration } from "@/hooks/useMLIntegration";
import { useMLProducts } from "@/hooks/useMLProducts";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { useState, useCallback, useMemo } from "react";
import { MLProductRow } from "./MLProductRow";
import { toast } from "@/hooks/use-toast";

export function MLProductList() {
  const { data, isLoading } = useMLProducts();
  const products = useMemo(() => data?.pages.flat() ?? [], [data]);
  const { sync, writeEnabled } = useMLIntegration();
  const { syncProduct, syncBatch, importFromML } = sync;
  
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  const handleSelectProduct = useCallback((productId: string, checked: boolean) => {
    if (checked) {
      setSelectedProducts(prev => [...prev, productId]);
    } else {
      setSelectedProducts(prev => prev.filter(id => id !== productId));
    }
  }, []);

  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedProducts((products || []).map(p => p.id));
    } else {
      setSelectedProducts([]);
    }
  }, [products]);

  const handleSyncProduct = useCallback((productId: string) => {
    syncProduct.mutate(productId);
  }, [syncProduct]);

  const handleSyncBatch = useCallback(() => {
    if (selectedProducts.length > 0) {
      syncBatch.mutate(selectedProducts);
      setSelectedProducts([]);
    }
  }, [selectedProducts, syncBatch]);

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
          
          <div className="flex gap-2">
            <Button
              onClick={() =>
                importFromML.mutate(undefined, {
                  onSuccess: (data) => {
                    toast({
                      title: "Importação Concluída",
                      description: `${data?.updated || 0} produtos atualizados e ${data?.created || 0} produtos importados do Mercado Livre.`,
                    });
                  },
                })
              }
              disabled={importFromML.isPending}
              size="sm"
            >
              {importFromML.isPending && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              Importar do ML
            </Button>

            {writeEnabled && selectedProducts.length > 0 && (
              <Button
                onClick={handleSyncBatch}
                disabled={syncBatch.isPending || syncProduct.isPending}
                size="sm"
              >
                {syncBatch.isPending || syncProduct.isPending ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Play className="mr-2 size-4" />
                )}
                Sincronizar Selecionados ({selectedProducts.length})
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {(products || []).length === 0 ? (
          <div className="py-8 text-center">
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
                    checked={selectedProducts.length === (products || []).length}
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
                {(products || []).map((product) => (
                  <MLProductRow
                    key={product.id}
                    product={product}
                    isSelected={selectedProducts.includes(product.id)}
                    onSelect={handleSelectProduct}
                    onSync={handleSyncProduct}
                    isProcessing={syncProduct.isPending}
                    isLoading={
                      syncProduct.isPending &&
                      syncProduct.variables === product.id
                    }
                    writeEnabled={writeEnabled}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
