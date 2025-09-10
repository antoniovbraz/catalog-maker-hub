import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  RefreshCw,
  Edit,
  Calendar,
  Box,
  Ruler,
  Weight,
  AlertTriangle,
  Info,
  Calculator,
} from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useProducts } from "@/hooks/useProducts";
import { useMLProducts } from "@/hooks/useMLProducts";
import { useProductImages } from "@/hooks/useProductImages";
import { useMLIntegration } from "@/hooks/useMLIntegration";
import { useMLProductResync } from "@/hooks/useMLProductResync";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { ProductSourceBadge } from "@/components/common/ProductSourceBadge";
import { useModal } from "@/contexts/ModalContext";
import { formatarMoeda } from "@/utils/pricing";
import { useAuth } from '@/contexts/useAuth';

// Type definitions
interface MLSyncLog {
  id: string;
  status: string;
  operation_type: string;
  created_at: string;
}

interface ProductPriceInfo {
  price: number;
  source: 'ml' | 'product';
}

interface Dimensions {
  length?: number;
  width?: number;
  height?: number;
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { openModal } = useModal();
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id;

  // Data fetching hooks
  const { data: products, isLoading: isLoadingProducts } = useProducts();
  const { data: mlProductsPages } = useMLProducts();
  const { data: productImages = [] } = useProductImages(id || '');
  const { isConnected } = useMLIntegration();
  const resyncProduct = useMLProductResync();

  // Find the specific product
  const product = products?.find((p) => p.id === id);
  const mlProducts = mlProductsPages?.pages.flat() || [];
  const dimensions =
    product?.dimensions && typeof product.dimensions === 'object'
      ? (product.dimensions as Dimensions)
      : undefined;

  // ML sync logs query
  const { data: syncLogs = [] } = useQuery<MLSyncLog[]>({
    queryKey: ['ml_sync_log', tenantId, id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from('ml_sync_log')
        .select('*')
        .eq('product_id', id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) {
        console.error('Error fetching sync logs:', error);
        return [];
      }
      
      return data || [];
    },
    enabled: !!id,
  });

  // Find ML product data
  const mlProduct = mlProducts.find((p) => p.ml_item_id === product?.ml_item_id);

  // Get price information with source
  const getPriceInfo = (): ProductPriceInfo | null => {
    if (mlProduct?.ml_price) {
      return { price: mlProduct.ml_price, source: 'ml' };
    }
    if (product?.price) {
      return { price: product.price, source: 'product' };
    }
    return null;
  };

  const priceInfo = getPriceInfo();

  const formatLatestActivity = (activity: MLSyncLog) => {
    if (!activity) return null;
    
    const date = format(new Date(activity.created_at), "dd/MM/yyyy 'às' HH:mm", {
      locale: ptBR,
    });
    
    const statusMap: { [key: string]: string } = {
      'success': 'Sucesso',
      'error': 'Erro',
      'pending': 'Pendente',
      'in_progress': 'Em Progresso'
    };
    
    const operationMap: { [key: string]: string } = {
      'sync': 'Sincronização',
      'create': 'Criação',
      'update': 'Atualização'
    };
    
    return {
      date,
      status: statusMap[activity.status] || activity.status,
      operation: operationMap[activity.operation_type] || activity.operation_type
    };
  };

  const latestActivity = syncLogs?.[0] ? formatLatestActivity(syncLogs[0]) : null;

  const handleEdit = () => {
    // TODO: Implement product edit modal
    console.log('Edit product:', id);
  };

  const handleRefresh = async () => {
    if (id && tenantId) {
      try {
        resyncProduct.resyncProduct.mutate({ productId: id });
      } catch (error) {
        console.error("Error resyncing product:", error);
      }
    }
  };

  const handleSyncToML = async () => {
    // TODO: Implement ML advertise modal
    console.log('Sync to ML:', id);
  };

  const handleCalculatePrice = () => {
    // TODO: Implement pricing calculator modal
    console.log('Calculate price for:', id);
  };

  const formatWeight = (w: number) => {
    if (w >= 1000) {
      return `${(w / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} kg`;
    }
    return `${w.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} g`;
  };

  // Helper function to safely render dimensions
  const renderDimension = (value: number | string | null | undefined, unit: string = 'cm'): string => {
    if (typeof value === 'number') return `${value} ${unit}`;
    if (typeof value === 'string') return `${value} ${unit}`;
    return '-';
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Loading state */}
        {isLoadingProducts && (
          <div className="space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        )}

        {/* Product not found */}
        {!isLoadingProducts && !product && (
          <Alert>
            <AlertTriangle className="size-4" />
            <AlertDescription>
              Produto não encontrado ou você não tem acesso a ele.
            </AlertDescription>
          </Alert>
        )}

        {/* Product found */}
        {!isLoadingProducts && product && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
                  <ProductSourceBadge source={product.source} />
                </div>
                {product.category_id && (
                  <p className="text-muted-foreground">
                    Categoria: {product.category_id}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleEdit}>
                  <Edit className="size-4 mr-2" />
                  Editar
                </Button>
                {isConnected && (
                  <>
                    <Button 
                      variant="outline" 
                      onClick={handleRefresh}
                      disabled={resyncProduct.resyncProduct.isPending}
                    >
                      <RefreshCw className={`size-4 mr-2 ${resyncProduct.resyncProduct.isPending ? 'animate-spin' : ''}`} />
                      Sincronizar
                    </Button>
                    <Button onClick={handleSyncToML}>
                      Anunciar no ML
                    </Button>
                  </>
                )}
                <Button variant="secondary" onClick={handleCalculatePrice}>
                  Calcular Preço
                </Button>
              </div>
            </div>

            {/* Main content grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left column - Product details */}
              <div className="lg:col-span-2 space-y-6">
                {/* Product information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Informações do Produto</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {product.description && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Descrição</label>
                        <p className="mt-1">{product.description}</p>
                      </div>
                    )}
                    
                    {product.sku && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">SKU</label>
                        <p className="font-mono">{product.sku}</p>
                      </div>
                    )}

                    {priceInfo && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Preço {priceInfo.source === 'ml' ? '(Mercado Livre)' : '(Produto)'}
                        </label>
                        <p className="text-2xl font-bold text-green-600">
                          {formatarMoeda(priceInfo.price)}
                        </p>
                      </div>
                    )}

                    {product.ml_available_quantity !== undefined && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Estoque ML</label>
                        <p className="text-lg font-semibold">{product.ml_available_quantity} unidades</p>
                      </div>
                    )}

                    {product.warranty && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Garantia</label>
                        <p>{typeof product.warranty === 'string' ? product.warranty : "Não informado"}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Costs and Taxes Card */}
                <Card>
                  <CardHeader>
                    <CardTitle>Custos e Impostos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Custo Unitário</label>
                        <p className="text-lg font-semibold">{formatarMoeda(typeof product.cost_unit === 'number' ? product.cost_unit : 0)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Custo de Embalagem</label>
                        <p className="text-lg font-semibold">{formatarMoeda(typeof product.packaging_cost === 'number' ? product.packaging_cost : 0)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Taxa de Imposto</label>
                        <p className="text-lg font-semibold">{String(typeof product.tax_rate === 'number' ? product.tax_rate : 0)}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Dimensions and Weight */}
                {(dimensions || typeof product.weight === 'number') && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Ruler className="size-4" />
                        Dimensões e Peso
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {typeof product.weight === 'number' && (
                          <div>
                            <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                              <Weight className="size-3" />
                              Peso
                            </label>
                            <p>{formatWeight(product.weight)}</p>
                          </div>
                        )}
                        {dimensions?.length && (
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Comprimento</label>
                            <p>{renderDimension(dimensions.length)}</p>
                          </div>
                        )}
                        {dimensions?.width && (
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Largura</label>
                            <p>{renderDimension(dimensions.width)}</p>
                          </div>
                        )}
                        {dimensions?.height && (
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Altura</label>
                            <p>{renderDimension(dimensions.height)}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Product Images */}
                {productImages.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Imagens do Produto</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {productImages.map((image, index) => (
                          <div key={index} className="aspect-square rounded-lg overflow-hidden border">
                            <img
                              src={image.image_url}
                              alt={`Imagem ${index + 1} do produto`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Right column - ML Integration status */}
              <div className="space-y-6">
                {/* ML Status */}
                {isConnected && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Info className="size-4" />
                        Status Mercado Livre
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {product.ml_item_id ? (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Status</span>
                            <Badge variant="secondary">Sincronizado</Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">ID do Item</span>
                            <span className="font-mono text-sm">{product.ml_item_id}</span>
                          </div>
                          {latestActivity && (
                            <div className="space-y-2">
                              <span className="text-sm text-muted-foreground">Última Atividade</span>
                              <div className="text-sm">
                                <p>{latestActivity.operation} - {latestActivity.status}</p>
                                <p className="text-muted-foreground">{latestActivity.date}</p>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-sm text-muted-foreground mb-3">
                            Produto não sincronizado com o Mercado Livre
                          </p>
                          <Button size="sm" onClick={handleSyncToML}>
                            Anunciar no ML
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Quick actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Ações Rápidas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start" 
                      onClick={handleCalculatePrice}
                    >
                      <Calculator className="size-4 mr-2" />
                      Calcular Preço
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="w-full justify-start" 
                      onClick={handleEdit}
                    >
                      <Edit className="size-4 mr-2" />
                      Editar Produto
                    </Button>
                    
                    {isConnected && product.ml_item_id && (
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                        onClick={handleRefresh}
                        disabled={resyncProduct.resyncProduct.isPending}
                      >
                        <RefreshCw className={`size-4 mr-2 ${resyncProduct.resyncProduct.isPending ? 'animate-spin' : ''}`} />
                        Sincronizar ML
                      </Button>
                    )}
                  </CardContent>
                </Card>

                {/* Recent sync history */}
                {syncLogs.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="size-4" />
                        Histórico de Sincronização
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {syncLogs.slice(0, 5).map((log) => {
                          const activity = formatLatestActivity(log);
                          if (!activity) return null;
                          
                          return (
                            <div key={log.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                              <div>
                                <p className="text-sm font-medium">{activity.operation}</p>
                                <p className="text-xs text-muted-foreground">{activity.date}</p>
                              </div>
                              <Badge 
                                variant={log.status === 'success' ? 'default' : 'destructive'}
                                className="text-xs"
                              >
                                {activity.status}
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}