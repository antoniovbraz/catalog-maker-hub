import { useParams, useNavigate } from "react-router-dom";
import {
  Package,
  ArrowLeft,
  ExternalLink,
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { formatarMoeda } from "@/utils/pricing";
import { useProduct } from "@/hooks/useProducts";
import type { ProductWithCategory } from "@/types/products";
import { useMLProducts } from "@/hooks/useMLProducts";
import { useMLProductResync } from "@/hooks/useMLProductResync";
import { useProductImages } from "@/hooks/useProductImages";
import { ProductSourceBadge } from "@/components/common/ProductSourceBadge";
import { useGlobalModal } from "@/hooks/useGlobalModal";
import { ProductModalForm } from "@/components/forms/ProductModalForm";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useMLConnectionStatus } from "@/hooks/useMLIntegration";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from '@/contexts/AuthContext';

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
  const { showFormModal } = useGlobalModal();
  
  const { data: productData, isLoading: productLoading } = useProduct(id!);
  const product = productData as ProductWithCategory;
  const productId = product?.id;
  const { data: mlProductsData } = useMLProducts();
  const mlProducts = mlProductsData?.pages.flat() ?? [];
  const { data: productImages = [] } = useProductImages(id!);
  const { resyncProduct } = useMLProductResync();
  const { isExpiringSoon, expiresAt } = useMLConnectionStatus();

  const { profile } = useAuth();
  const tenantId = profile?.tenant_id;

  const { data: syncLog = [] } = useQuery<MLSyncLog[]>({
    queryKey: ["ml_sync_log", tenantId, productId],
    queryFn: async () => {
      if (!productId) return [];
      const { data, error } = await supabase
        .from("ml_sync_log")
        .select("id, status, operation_type, created_at")
        .eq("entity_id", productId)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw new Error(error.message);
      return data as MLSyncLog[];
    },
    enabled: !!productId && !!tenantId,
  });

  const { data: priceInfo } = useQuery<ProductPriceInfo | null>({
    queryKey: ["product-price", productId],
    queryFn: async () => {
      if (!productId) return null;
      const { data: mlData } = await supabase
        .from("ml_product_mapping")
        .select("ml_price")
        .eq("product_id", productId)
        .maybeSingle();
      if (mlData?.ml_price) {
        return { price: mlData.ml_price, source: "ml" as const };
      }
      const { data: productRow } = await supabase
        .from("products")
        .select("price")
        .eq("id", productId)
        .maybeSingle();
      return {
        price: productRow?.price || 0,
        source: "product" as const,
      };
    },
    enabled: !!productId,
  });

  if (productLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <Package className="size-12 text-muted-foreground" />
        <div className="text-center">
          <h2 className="text-lg font-semibold">Produto não encontrado</h2>
          <p className="text-muted-foreground">O produto solicitado não existe ou foi removido.</p>
        </div>
        <Button onClick={() => navigate('/products')}>
          <ArrowLeft className="mr-2 size-4" />
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

  const handleEdit = () => {
    let submitForm: (() => Promise<void>) | null = null;

    showFormModal({
      title: "Editar Produto",
      description: "Atualize as informações do produto",
      content: (
        <ProductModalForm
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

  const handleResync = () => {
    if (product.id) {
      resyncProduct.mutate({ productId: product.id });
    }
  };

  return (
    <div className="container mx-auto max-w-6xl px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/products')}
          >
            <ArrowLeft className="mr-2 size-4" />
            Voltar
          </Button>
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <Package className="size-6" />
              {product.name}
            </h1>
            <p className="text-muted-foreground">Detalhes do produto</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleEdit}>
            <Edit className="mr-2 size-4" />
            Editar
          </Button>
        </div>
      </div>

      {/* Alert Token Expiring */}
      {isExpiringSoon && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="size-4" />
          <AlertDescription>
            O token do Mercado Livre expira em breve
            {expiresAt
              ? ` (${format(new Date(expiresAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })})`
              : ''}
          </AlertDescription>
        </Alert>
      )}

      {/* Alert para dados incompletos */}
      {hasIncompleteData && (
        <Card className="mb-6 border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-orange-700">
              <RefreshCw className="size-4" />
              <span className="font-medium">Dados Incompletos</span>
            </div>
            <p className="mt-1 text-sm text-orange-600">
              Este produto foi importado do Mercado Livre mas alguns dados não foram capturados.
              Clique em "Re-sincronizar" para atualizar as informações.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Coluna Principal */}
        <div className="space-y-6 lg:col-span-2">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="size-5" />
                Informações Básicas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Nome</label>
                  <p className="font-medium">{product.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">SKU</label>
                  {product.source === 'mercado_livre' ? (
                    product.ml_seller_sku ? (
                      <div className="flex items-center gap-2">
                        <p>{product.ml_seller_sku}</p>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="outline">SKU Original ML</Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              SKU definido originalmente no Mercado Livre
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    ) : (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-muted-foreground">—</span>
                          </TooltipTrigger>
                          <TooltipContent>Defina o SKU no ML</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )
                  ) : (
                    <p>
                      {product.sku || (
                        <span className="text-muted-foreground">Não informado</span>
                      )}
                    </p>
                  )}
                </div>
              </div>

              {product.description && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Descrição</label>
                  <p className="mt-1 text-sm leading-relaxed">{product.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Marca</label>
                  <p>{product.brand || <span className="text-muted-foreground">Não informado</span>}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Modelo</label>
                  <p>{product.model || <span className="text-muted-foreground">Não informado</span>}</p>
                </div>
              </div>

              {product.warranty && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Garantia</label>
                  <p>{product.warranty}</p>
                 </div>
               )}
             </CardContent>
            </Card>

          {/* @ts-ignore - Temporary fix for JSX comment type inference */}
          {/* Custos e Impostos */}
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
                  <div className="flex items-center gap-1">
                    <label className="text-sm font-medium text-muted-foreground">Preço de venda</label>
                    {priceInfo?.source === "ml" && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="size-3 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>Preço do Mercado Livre</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                  <p className="text-lg font-semibold">{formatarMoeda(priceInfo?.price || 0)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Custo Unitário</label>
                  <p className="text-lg font-semibold">{formatarMoeda(product.cost_unit)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Custo Embalagem</label>
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
                      <p>{formatWeight(product.weight)}</p>
                    </div>
                   )}
                   {/* @ts-ignore - Temporary fix for dimensions type inference */}
                   {product.dimensions &&
                     typeof product.dimensions === 'object' &&
                     'weight' in product.dimensions &&
                     (product.dimensions as Record<string, number>).weight && (
                       <div>
                         <label className="text-sm font-medium text-muted-foreground">Peso (Dimensões)</label>
                         <p>{(product.dimensions as Record<string, number>).weight} g</p>
                       </div>
                    )}
                   {product.dimensions &&
                     typeof product.dimensions === 'object' &&
                     'length' in product.dimensions &&
                     (product.dimensions as Record<string, number>).length && (
                       <div>
                         <label className="text-sm font-medium text-muted-foreground">Comprimento</label>
                         <p>{(product.dimensions as Record<string, number>).length} cm</p>
                       </div>
                    )}
                   {product.dimensions &&
                     typeof product.dimensions === 'object' &&
                     'width' in product.dimensions &&
                     (product.dimensions as Record<string, number>).width && (
                       <div>
                         <label className="text-sm font-medium text-muted-foreground">Largura</label>
                         <p>{(product.dimensions as Record<string, number>).width} cm</p>
                       </div>
                     )}
                   {product.dimensions &&
                     typeof product.dimensions === 'object' &&
                     'height' in product.dimensions &&
                     (product.dimensions as Record<string, number>).height && (
                       <div>
                         <label className="text-sm font-medium text-muted-foreground">Altura</label>
                         <p>{(product.dimensions as Record<string, number>).height} cm</p>
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
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                  {productImages.map((image, index) => (
                    <div key={index} className="aspect-square overflow-hidden rounded-lg border">
                      <img
                        src={image.image_url}
                        alt={`${product.name} - Imagem ${index + 1}`}
                        className="size-full cursor-pointer object-cover transition-transform hover:scale-105"
                        onClick={() => window.open(image.image_url, '_blank')}
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
                    key={attr.id || attr.name || index}
                    className="flex justify-between text-sm"
                  >
                     <span className="font-medium">{attr.name || attr.id || 'N/A'}</span>
                     <span>{attr.value_name || attr.value_id || '-'}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Variações */}
          {(variations.length > 0 || product.ml_variation_id) && (
            <Card>
              <CardHeader>
                <CardTitle>Variações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
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
                      {variation.available_quantity != null && (
                        <div>Estoque: {variation.available_quantity}</div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm">ID da variação: {product.ml_variation_id}</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Coluna Lateral */}
        <div className="space-y-6">
          {/* Status e Origem */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Origem</label>
                <div className="mt-1">
                  <ProductSourceBadge 
                    source={product.source} 
                    mlStatus={mlProduct?.sync_status}
                    mlItemId={mlProduct?.ml_item_id || undefined}
                  />
                </div>
              </div>

              {product.categories && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Categoria</label>
                  <p className="mt-1 flex items-center gap-1">
                    <Tag className="size-3" />
                    {product.categories.name}
                  </p>
                </div>
              )}

              <Separator />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Criado em:</span>
                  <span>{format(new Date(product.created_at), 'dd/MM/yyyy', { locale: ptBR })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Atualizado:</span>
                  <span>{format(new Date(product.updated_at), 'dd/MM/yyyy', { locale: ptBR })}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações ML */}
          {mlProduct && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Box className="size-5" />
                  Mercado Livre
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {mlProduct.ml_item_id && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">ID do Anúncio</label>
                    <p className="font-mono text-sm">{mlProduct.ml_item_id}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Estoque ML</label>
                    <p>{product.ml_available_quantity || 0}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Vendidos</label>
                    <p>{product.ml_sold_quantity || 0}</p>
                  </div>
                </div>

                {mlProduct.last_sync_at && (
                  <div>
                    <label className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
                      <Calendar className="size-3" />
                      Última Sincronização
                    </label>
                    <p className="text-sm">{format(new Date(mlProduct.last_sync_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-2">
                  {mlProduct.ml_permalink && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(mlProduct.ml_permalink!, '_blank')}
                    >
                      <ExternalLink className="mr-2 size-4" />
                      Abrir no Mercado Livre
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResync}
                    disabled={resyncProduct.isPending}
                  >
                    <RefreshCw className={`mr-2 size-4 ${resyncProduct.isPending ? 'animate-spin' : ''}`} />
                    {resyncProduct.isPending ? 'Re-sincronizando...' : 'Re-sincronizar'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Registro de Sincronizações */}
          {syncLog.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Registro de Sincronizações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {syncLog.map((log) => (
                  <div key={log.id} className="border-b pb-2 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <span>{format(new Date(log.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</span>
                      <Badge variant={log.status === 'success' ? 'default' : 'destructive'}>
                        {log.status}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground">{log.operation_type}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}