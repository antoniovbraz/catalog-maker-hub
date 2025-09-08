import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  RefreshCw,
  Edit,
  Tag,
  Calendar,
  Box,
  Ruler,
  Weight,
  AlertTriangle,
  Info,
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
import { useGlobalModal } from "@/hooks/useGlobalModal";
import { formatarMoeda } from "@/utils/pricing";
import { useAuth } from '@/contexts/AuthContext';

// Type definitions
interface MLSyncLog {
  id: string;
  status: string;
  operation_type: string;
  created_at: string;
}

interface MLAttribute {
  id?: string;
  name?: string;
  value_name?: string;
  value_id?: string;
}

interface MLVariation {
  id?: string;
  price?: number;
  available_quantity?: number;
  attribute_combinations?: { name: string; value_name: string }[];
}

interface ProductPriceInfo {
  price: number;
  source: 'ml' | 'product';
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { openModal } = useGlobalModal();
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id;

  // Data fetching hooks
  const { data: products, isLoading: isLoadingProducts } = useProducts();
  const { data: mlProductsPages } = useMLProducts();
  const { data: productImages = [] } = useProductImages(id || '');
  const { isConnected, accessToken } = useMLIntegration();
  const resyncProduct = useMLProductResync();

  // Find the specific product
  const product = products?.find((p) => p.id === id);
  const mlProducts = mlProductsPages?.pages.flat() || [];

  // ML sync logs query
  const { data: syncLogs = [] } = useQuery<MLSyncLog[]>({
    queryKey: ['ml_sync_logs', tenantId, id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from('ml_sync_logs')
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
    enabled: !!id && !!tenantId,
  });

  // Product price info query  
  const { data: priceInfo } = useQuery<ProductPriceInfo>({
    queryKey: ['product_price_info', tenantId, id],
    queryFn: async () => {
      if (!product) return { price: 0, source: 'product' as const };
      
      const mlProduct = mlProducts.find(ml => ml.id === product.id);
      if (mlProduct && mlProduct.ml_price) {
        return { price: mlProduct.ml_price, source: 'ml' as const };
      }
      
      return { 
        price: product.cost_unit || 0, 
        source: 'product' as const 
      };
    },
    enabled: !!product,
  });

  // Event handlers
  const handleEdit = () => {
    if (product) {
      openModal({
        type: 'product',
        mode: 'edit',
        data: product,
      });
    }
  };

  const handleResync = () => {
    if (product?.id) {
      resyncProduct.mutate({ productId: product.id });
    }
  };

  // Loading and error states
  if (isLoadingProducts) {
    return (
      <div className="container mx-auto p-6">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-48" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-32" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto p-6">
        <Button
          variant="outline"
          onClick={() => navigate('/produtos')}
          className="mb-6"
        >
          Voltar para Produtos
        </Button>
      </div>
    );
  }

  const attributes: MLAttribute[] = Array.isArray(product.ml_attributes)
    ? (product.ml_attributes as MLAttribute[])
    : [];

  const variations: MLVariation[] = Array.isArray(product.ml_variations)
    ? (product.ml_variations as MLVariation[])
    : [];

  const mlProduct = mlProducts.find(ml => ml.id === product.id);
  const hasIncompleteData =
    product.source === 'mercado_livre' &&
    (!product.description || !product.ml_seller_sku || !product.brand);

  const formatWeight = (w: number) => {
    if (w >= 1000) {
      return `${(w / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} kg`;
    }
    return `${w.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} g`;
  };

  // Helper function to safely render dimensions
  const renderDimension = (value: unknown, unit: string = 'cm'): string => {
    if (typeof value === 'number') return `${value} ${unit}`;
    if (typeof value === 'string') return `${value} ${unit}`;
    return '-';
  };

  // Check if token is expiring (30 days)
  const isTokenExpiring = accessToken && isConnected && (() => {
    try {
      const tokenData = JSON.parse(atob(accessToken.split('.')[1]));
      const expiryTime = tokenData.exp * 1000;
      const thirtyDaysFromNow = Date.now() + (30 * 24 * 60 * 60 * 1000);
      return expiryTime < thirtyDaysFromNow;
    } catch {
      return false;
    }
  })();

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate('/produtos')}
          >
            Voltar para Produtos
          </Button>
          <h1 className="text-2xl font-bold">Detalhes do Produto</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleEdit}>
            <Edit className="mr-2 size-4" />
            Editar
          </Button>
          {isConnected && product.source === 'mercado_livre' && (
            <Button
              variant="secondary"
              onClick={handleResync}
              disabled={resyncProduct.isPending}
            >
              <RefreshCw className={`mr-2 size-4 ${resyncProduct.isPending ? 'animate-spin' : ''}`} />
              {resyncProduct.isPending ? 'Re-sincronizando...' : 'Re-sincronizar'}
            </Button>
          )}
        </div>
      </div>

      {/* Alerts */}
      {isTokenExpiring && (
        <Alert className="mb-6">
          <AlertTriangle className="size-4" />
          <AlertDescription>
            Seu token do Mercado Livre expira em menos de 30 dias. Considere renovar sua integração.
          </AlertDescription>
        </Alert>
      )}

      {hasIncompleteData && (
        <Alert className="mb-6">
          <Info className="size-4" />
          <AlertDescription>
            Este produto importado do Mercado Livre possui dados incompletos. 
            Considere completar as informações manualmente.
          </AlertDescription>
        </Alert>
      )}

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information Card */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-3">
                    <Box className="size-5" />
                    <span className="text-xl">{product.name}</span>
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <ProductSourceBadge source={product.source} />
                    {product.ml_seller_sku && (
                      <Badge variant="outline">
                        SKU ML: {product.ml_seller_sku}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Nome</label>
                <p className="font-medium">{product.name}</p>
              </div>

              {product.ml_seller_sku && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">SKU ML</label>
                  <p>{product.ml_seller_sku}</p>
                </div>
              )}

              <Separator />

              {product.description && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Descrição</label>
                  <p className="mt-1 text-sm leading-relaxed">{product.description}</p>
                </div>
              )}

              {product.brand && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Marca</label>
                  <p>{typeof product.brand === 'string' ? product.brand : String(product.brand)}</p>
                </div>
              )}

              {product.model && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Modelo</label>
                  <p>{String(product.model)}</p>
                </div>
              )}

              {product.warranty && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Garantia</label>
                  <p>{product.warranty ? String(product.warranty) : 'Não informado'}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Costs and Taxes Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="size-5" />
                Custos e Impostos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Custo Unitário</label>
                  <p className="text-lg font-semibold">{formatarMoeda(product.cost_unit)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Custo de Embalagem</label>
                  <p className="text-lg font-semibold">{formatarMoeda(product.packaging_cost || 0)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Taxa de Imposto</label>
                  <p className="text-lg font-semibold">{product.tax_rate || 0}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dimensões e Peso */}
          {(product.weight || product.dimensions) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ruler className="size-5" />
                  Dimensões e Peso
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {product.weight && (
                    <div>
                      <label className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
                        <Weight className="size-3" />
                        Peso
                      </label>
                      <p>{formatWeight(product.weight as number)}</p>
                    </div>
                  )}
                  {product.dimensions &&
                    typeof product.dimensions === 'object' &&
                    'length' in product.dimensions &&
                    (product.dimensions as Record<string, any>).length && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Comprimento</label>
                        <p>{renderDimension((product.dimensions as Record<string, any>).length)}</p>
                      </div>
                    )}
                  {product.dimensions &&
                    typeof product.dimensions === 'object' &&
                    'width' in product.dimensions &&
                    (product.dimensions as Record<string, any>).width && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Largura</label>
                        <p>{renderDimension((product.dimensions as Record<string, any>).width)}</p>
                      </div>
                    )}
                  {product.dimensions &&
                    typeof product.dimensions === 'object' &&
                    'height' in product.dimensions &&
                    (product.dimensions as Record<string, any>).height && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Altura</label>
                        <p>{renderDimension((product.dimensions as Record<string, any>).height)}</p>
                      </div>
                    )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Imagens do Produto */}
          {productImages.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Imagens do Produto</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {productImages.map((image, index) => (
                    <div key={image.id} className="rounded-lg overflow-hidden border">
                      <img
                        src={image.image_url}
                        alt={`${product.name} - Imagem ${index + 1}`}
                        className="w-full h-32 object-cover"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Atributos ML */}
          {attributes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Atributos ML</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2">
                {attributes.map((attr, index) => (
                  <div
                    key={(attr as any).id || (attr as any).name || index}
                    className="flex justify-between text-sm"
                  >
                     <span className="font-medium">{String((attr as any).name || (attr as any).id || 'N/A')}</span>
                     <span>{String((attr as any).value_name || (attr as any).value_id || '-')}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Variações ML */}
          <Card>
            <CardHeader>
              <CardTitle>Variações ML</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {variations.length > 0 ? (
                  variations.map((variation, index) => (
                    <div
                      key={variation.id || index}
                      className="rounded-md border p-2 text-sm"
                    >
                      {variation.attribute_combinations && (
                        <div className="mb-1">
                          {variation.attribute_combinations.map((comb, idx) => (
                            <div key={idx}>{`${comb.name}: ${comb.value_name}`}</div>
                          ))}
                        </div>
                      )}
                      {variation.price && (
                        <div>Preço: {formatarMoeda(variation.price)}</div>
                      )}
                      {variation.available_quantity !== undefined && (
                        <div>Quantidade: {variation.available_quantity}</div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm">ID da variação: {product.ml_variation_id}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="size-5" />
                Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ProductSourceBadge 
                source={product.source} 
              />
              {product.categories && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Categoria</label>
                  <p className="text-sm">
                    {product.categories.name}
                  </p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-muted-foreground">Data de Criação</label>
                <div className="flex items-center gap-1 text-sm">
                  <Calendar className="size-3" />
                  <span>{format(new Date(product.created_at), 'dd/MM/yyyy', { locale: ptBR })}</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Última Atualização</label>
                <span>{format(new Date(product.updated_at), 'dd/MM/yyyy', { locale: ptBR })}</span>
              </div>
            </CardContent>
          </Card>

          {/* ML Product Info */}
          {mlProduct && (
            <Card>
              <CardHeader>
                <CardTitle>Informações ML</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">ID do Item ML</label>
                  <p className="font-mono text-sm">{mlProduct.ml_item_id}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Estoque Disponível</label>
                    <p>{product.ml_available_quantity || 0}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Vendidos</label>
                    <p>{product.ml_sold_quantity || 0}</p>
                  </div>
                </div>

                <Separator />
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Última Sincronização</label>
                  <p className="text-sm">{format(new Date(mlProduct.last_sync_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
                </div>

                {mlProduct.ml_permalink && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => window.open(mlProduct.ml_permalink!, '_blank')}
                  >
                    Ver no ML
                  </Button>
                )}

                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  onClick={handleResync}
                  disabled={resyncProduct.isPending}
                >
                  <RefreshCw className={`mr-2 size-4 ${resyncProduct.isPending ? 'animate-spin' : ''}`} />
                  {resyncProduct.isPending ? 'Re-sincronizando...' : 'Re-sincronizar'}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Sync Logs */}
          {syncLogs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Sincronizações</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {syncLogs.map((log) => (
                    <div key={log.id} className="text-xs p-2 rounded border">
                      <div className="flex justify-between items-center">
                        <Badge
                          variant={log.status === 'success' ? 'default' : 'destructive'}
                          className="text-xs"
                        >
                          {log.status}
                        </Badge>
                        <span className="text-muted-foreground">
                          {format(new Date(log.created_at), 'dd/MM HH:mm', { locale: ptBR })}
                        </span>
                      </div>
                      <p className="mt-1">{log.operation_type}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}