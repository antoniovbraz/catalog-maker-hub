import { useState } from "react";
import { Package, ShoppingCart, TrendingUp, AlertTriangle, ExternalLink, Settings } from "@/components/ui/icons";
import { RotateCcw } from "lucide-react";
import { ConfigurationPageLayout } from "@/components/layout/ConfigurationPageLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataVisualization } from "@/components/ui/data-visualization";
import type { DataColumn, DataAction } from "@/components/ui/data-visualization";
import { useMLIntegration, useMLSync } from "@/hooks/useMLIntegration";
import { useProductsWithCategories } from "@/hooks/useProducts";
import { formatarMoeda } from "@/utils/pricing";
import { useGlobalModal } from "@/hooks/useGlobalModal";
import { MLAdvertiseModal } from "@/components/forms/MLAdvertiseModal";
import { MLSyncSettingsModal } from "@/components/forms/MLSyncSettingsModal";

export default function MLDashboard() {
  const { sync, syncStatusQuery } = useMLIntegration();
  const { syncBatch } = useMLSync();
  const { data: allProducts = [], isLoading: isLoadingProducts } = useProductsWithCategories();
  const mlProducts = sync?.products || [];
  const isLoadingML = syncStatusQuery.isLoading;
  const { showFormModal } = useGlobalModal();
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  // Calcular métricas
  const metrics = {
    totalProducts: allProducts.length,
    manualProducts: allProducts.filter(p => p.source === 'manual').length,
    mlProducts: allProducts.filter(p => p.source === 'mercado_livre').length,
    syncedProducts: mlProducts.filter(p => p.sync_status === 'synced').length,
    errorProducts: mlProducts.filter(p => p.sync_status === 'error').length,
    pendingProducts: mlProducts.filter(p => p.sync_status === 'not_synced').length,
  };

  // Produtos sem anúncios (manuais que não estão mapeados)
  const productsWithoutAds = allProducts.filter(product => 
    product.source === 'manual' && 
    !mlProducts.some(ml => ml.id === product.id)
  );

  const handleBatchAdvertise = () => {
    if (selectedProducts.length === 0) return;
    
    const products = productsWithoutAds.filter(p => selectedProducts.includes(p.id));
    // TODO: Implementar modal de criação em lote
    console.log('Batch advertise:', products);
  };

  const handleSyncSettings = () => {
    let submitForm: (() => Promise<void>) | null = null;

    showFormModal({
      title: "Configurações de Sincronização",
      description: "Configure como os produtos serão sincronizados com o Mercado Livre",
      content: (
        <MLSyncSettingsModal
          onSuccess={() => {}}
          onSubmitForm={(fn) => {
            submitForm = fn;
          }}
        />
      ),
      onSave: async () => {
        if (submitForm) await submitForm();
      },
      size: "lg",
    });
  };

  const handleAdvertiseProduct = (product: any) => {
    let submitForm: (() => Promise<void>) | null = null;

    showFormModal({
      title: "Anunciar no Mercado Livre",
      description: `Criar anúncio para "${product.name}"`,
      content: (
        <MLAdvertiseModal
          product={product}
          onSuccess={() => {}}
          onSubmitForm={(fn) => {
            submitForm = fn;
          }}
        />
      ),
      onSave: async () => {
        if (submitForm) await submitForm();
      },
      size: "lg",
    });
  };

  const syncColumns: DataColumn<any>[] = [
    {
      key: "name",
      header: "Produto",
      render: (item) => (
        <div className="flex items-center gap-2">
          <Package className="size-4 text-muted-foreground" />
          <span className="font-medium">{item.name}</span>
        </div>
      ),
    },
    {
      key: "sync_status",
      header: "Status",
      render: (item) => {
        const statusConfig = {
          not_synced: { label: 'Não Sincronizado', variant: 'secondary' as const },
          syncing: { label: 'Sincronizando', variant: 'default' as const },
          synced: { label: 'Sincronizado', variant: 'outline' as const },
          error: { label: 'Erro', variant: 'destructive' as const },
        };
        const config = statusConfig[item.sync_status as keyof typeof statusConfig];
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      key: "ml_item_id",
      header: "Anúncio ML",
      render: (item) => item.ml_item_id ? (
        <a
          href={`https://www.mercadolivre.com.br/MLB-${item.ml_item_id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-primary hover:underline"
        >
          <ExternalLink className="size-3" />
          {item.ml_item_id}
        </a>
      ) : (
        <span className="text-muted-foreground">-</span>
      ),
    },
  ];

  const noAdsColumns: DataColumn<any>[] = [
    {
      key: "name",
      header: "Produto",
      render: (item) => (
        <div className="flex items-center gap-2">
          <Package className="size-4 text-muted-foreground" />
          <span className="font-medium">{item.name}</span>
        </div>
      ),
    },
    {
      key: "cost_unit",
      header: "Custo",
      render: (item) => (
        <span className="font-mono text-sm">{formatarMoeda(item.cost_unit || 0)}</span>
      ),
    },
    {
      key: "categories.name",
      header: "Categoria",
      render: (item) => item.categories?.name || "Sem categoria",
    },
  ];

  const syncActions: DataAction<any>[] = [
    {
      label: "Sincronizar",
      icon: <RotateCcw className="size-4" />,
      onClick: (item) => syncBatch.mutate([item.id]),
      variant: "outline",
    },
  ];

  const noAdsActions: DataAction<any>[] = [
    {
      label: "Anunciar no ML",
      icon: <ShoppingCart className="size-4" />,
      onClick: handleAdvertiseProduct,
      variant: "default",
    },
  ];

  const breadcrumbs = [
    { label: "Configurações", href: "/dashboard" },
    { label: "Dashboard ML" },
  ];

  const headerActions = (
    <div className="flex gap-2">
      <Button size="sm" variant="outline" onClick={handleSyncSettings}>
        <Settings className="mr-2 size-4" />
        Configurações
      </Button>
      {selectedProducts.length > 0 && (
        <Button size="sm" onClick={handleBatchAdvertise}>
          <ShoppingCart className="mr-2 size-4" />
          Anunciar Selecionados ({selectedProducts.length})
        </Button>
      )}
    </div>
  );

  return (
    <ConfigurationPageLayout
      title="Dashboard Mercado Livre"
      description="Gerencie produtos, anúncios e sincronização com o Mercado Livre"
      icon={<ShoppingCart className="size-6" />}
      breadcrumbs={breadcrumbs}
      actions={headerActions}
    >
      {/* Cards de Métricas */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.manualProducts} manuais • {metrics.mlProducts} do ML
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <TrendingUp className="size-4 text-green-500" />
              Sincronizados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.syncedProducts}</div>
            <p className="text-xs text-muted-foreground">
              Produtos com anúncios ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <AlertTriangle className="size-4 text-amber-500" />
              Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{metrics.pendingProducts}</div>
            <p className="text-xs text-muted-foreground">
              Aguardando sincronização
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              <AlertTriangle className="size-4 text-red-500" />
              Erros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics.errorProducts}</div>
            <p className="text-xs text-muted-foreground">
              Falhas na sincronização
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Conteúdo */}
      <Tabs defaultValue="sync-status" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sync-status">Status de Sincronização</TabsTrigger>
          <TabsTrigger value="no-ads">Produtos sem Anúncios</TabsTrigger>
        </TabsList>

        <TabsContent value="sync-status" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Produtos com Mapeamento ML</CardTitle>
              <CardDescription>
                Produtos que possuem configuração para sincronização com Mercado Livre
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataVisualization
                title=""
                data={mlProducts}
                columns={syncColumns}
                actions={syncActions}
                isLoading={isLoadingML}
                emptyState={
                  <div className="py-8 text-center">
                    <p className="text-muted-foreground">Nenhum produto mapeado</p>
                    <p className="text-sm text-muted-foreground">
                      Importe produtos do ML ou crie anúncios para produtos manuais
                    </p>
                  </div>
                }
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="no-ads" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Produtos Manuais sem Anúncios</CardTitle>
              <CardDescription>
                Produtos criados manualmente que ainda não possuem anúncios no Mercado Livre
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataVisualization
                title=""
                data={productsWithoutAds}
                columns={noAdsColumns}
                actions={noAdsActions}
                isLoading={isLoadingProducts}
                emptyState={
                  <div className="py-8 text-center">
                    <p className="text-muted-foreground">Todos os produtos manuais já possuem anúncios</p>
                    <p className="text-sm text-muted-foreground">
                      Ótimo! Seus produtos estão configurados no Mercado Livre
                    </p>
                  </div>
                }
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </ConfigurationPageLayout>
  );
}