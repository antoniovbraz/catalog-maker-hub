import { useParams, useNavigate } from "react-router-dom";
import { Package, ArrowLeft, ExternalLink, RefreshCw, Edit, Tag, Calendar, Box, Ruler, Weight } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { formatarMoeda } from "@/utils/pricing";
import { useProduct } from "@/hooks/useProducts";
import type { ProductWithCategory } from "@/types/products";
import { useMLProducts } from "@/hooks/useMLProducts";
import { useMLResync } from "@/hooks/useMLResync";
import { useProductImages } from "@/hooks/useProductImages";
import { ProductSourceBadge } from "@/components/common/ProductSourceBadge";
import { useGlobalModal } from "@/hooks/useGlobalModal";
import { ProductModalForm } from "@/components/forms/ProductModalForm";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showFormModal } = useGlobalModal();
  
  const { data: productData, isLoading: productLoading } = useProduct(id!);
  const product = productData as ProductWithCategory;
  const { data: mlProducts = [] } = useMLProducts();
  const { data: productImages = [] } = useProductImages(id!);
  const { resyncProduct } = useMLResync();

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

  const mlProduct = mlProducts.find(ml => ml.id === product.id);
  const hasIncompleteData = product.source === 'mercado_livre' && (!product.description || !product.sku || !product.brand);

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
          {hasIncompleteData && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleResync}
              disabled={resyncProduct.isPending}
            >
              <RefreshCw className={`mr-2 size-4 ${resyncProduct.isPending ? 'animate-spin' : ''}`} />
              {resyncProduct.isPending ? 'Re-sincronizando...' : 'Re-sincronizar'}
            </Button>
          )}
          
          <Button size="sm" onClick={handleEdit}>
            <Edit className="mr-2 size-4" />
            Editar
          </Button>

          {mlProduct?.ml_item_id && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open(`https://www.mercadolivre.com.br/MLB-${mlProduct.ml_item_id}`, '_blank')}
            >
              <ExternalLink className="mr-2 size-4" />
              Ver no ML
            </Button>
          )}
        </div>
      </div>

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
                  <p>{product.sku || <span className="text-muted-foreground">Não informado</span>}</p>
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

          {/* Custos e Impostos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="size-5" />
                Custos e Impostos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
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
                      <p>{product.weight} kg</p>
                    </div>
                  )}
                  {product.dimensions?.length && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Comprimento</label>
                      <p>{product.dimensions.length} cm</p>
                    </div>
                  )}
                  {product.dimensions?.width && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Largura</label>
                      <p>{product.dimensions.width} cm</p>
                    </div>
                  )}
                  {product.dimensions?.height && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Altura</label>
                      <p>{product.dimensions.height} cm</p>
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
                    mlItemId={mlProduct?.ml_item_id}
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
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}