import { useState } from "react";
import { ConfigurationPageLayout } from "@/components/layout/ConfigurationPageLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Upload, 
  Wand2, 
  Image as ImageIcon, 
  Trash2, 
  Eye, 
  Sparkles,
  Info,
  Package,
  ShoppingCart,
  Camera
} from "@/components/ui/icons";
import { useProducts } from "@/hooks/useProducts";
import { useProductImages, useUploadProductImage, useDeleteProductImage } from "@/hooks/useProductImages";
import { useGenerateListing } from "@/hooks/useAdGeneration";
import { AdChatInterface } from "@/components/forms/AdChatInterface";
import { MarketplaceDestination, ProductImage } from "@/types/ads";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

const MARKETPLACE_OPTIONS = [
  { value: 'mercado_livre', label: 'Mercado Livre', icon: '🛒', color: 'bg-brand-primary' },
  { value: 'shopee', label: 'Shopee', icon: '🛍️', color: 'bg-brand-danger' },
  { value: 'instagram', label: 'Instagram', icon: '📸', color: 'bg-brand-secondary' },
] as const;

export default function AdGenerator() {
  const { toast } = useToast();
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedMarketplace, setSelectedMarketplace] = useState<MarketplaceDestination | "">("");
  const [customPrompt, setCustomPrompt] = useState("");
  interface GeneratedResult {
    title?: string;
    description: string;
    keywords?: string[];
  }
  const [generatedResult, setGeneratedResult] = useState<GeneratedResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [mode, setMode] = useState<'quick' | 'strategic'>('quick');

  const { data: products = [] } = useProducts();
  const { data: images = [], refetch: refetchImages } = useProductImages(selectedProductId);
  const uploadMutation = useUploadProductImage();
  const deleteMutation = useDeleteProductImage();
  const generateMutation = useGenerateListing();

  const selectedProduct = products.find(p => p.id === selectedProductId);
  const imageUrls = images.map(img => img.image_url);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || !selectedProductId) return;

    const validFiles = Array.from(files).filter(file => {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Arquivo inválido",
          description: `${file.name} não é uma imagem válida.`,
          variant: "destructive"
        });
        return false;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB
        toast({
          title: "Arquivo muito grande",
          description: `${file.name} excede o limite de 5MB.`,
          variant: "destructive"
        });
        return false;
      }
      return true;
    });

    for (const file of validFiles) {
      try {
        await uploadMutation.mutateAsync({
          productId: selectedProductId,
          file,
          imageType: 'product',
          sortOrder: images.length
        });
      } catch (error) {
        console.error('Erro no upload:', error);
      }
    }
    
    refetchImages();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const handleGenerate = async () => {
    if (!selectedProductId || !selectedMarketplace || imageUrls.length === 0) {
      toast({
        title: "Dados incompletos",
        description: "Selecione um produto, marketplace e adicione pelo menos uma imagem.",
        variant: "destructive"
      });
      return;
    }

    try {
      const result = await generateMutation.mutateAsync({
        product_id: selectedProductId,
        marketplace: selectedMarketplace,
        image_urls: imageUrls,
        custom_prompt: customPrompt || undefined
      });
      
      setGeneratedResult(result);
    } catch (error) {
      console.error('Erro na geração:', error);
    }
  };

  const canGenerate = selectedProductId && selectedMarketplace && images.length > 0;

  return (
    <ConfigurationPageLayout
      title="Gerador de Anúncios"
      description="Crie anúncios otimizados para diferentes marketplaces usando IA"
      breadcrumbs={[
        { href: "/dashboard", label: "Dashboard" },
        { href: "/ad-generator", label: "Gerador de Anúncios" }
      ]}
      actions={
        mode === 'quick' ? (
          <Button 
            onClick={handleGenerate}
            disabled={!canGenerate || generateMutation.isPending}
            className="bg-gradient-primary hover:opacity-90"
          >
            <Wand2 className="w-4 h-4 mr-2" />
            {generateMutation.isPending ? "Gerando..." : "Gerar Anúncio"}
          </Button>
        ) : null
      }
    >
      {/* Mode Toggle */}
      <div className="xl:col-span-12 mb-6">
        <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
          <span className="font-medium">Modo de Geração:</span>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={mode === 'quick' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('quick')}
            >
              Rápido
            </Button>
            <Button
              variant={mode === 'strategic' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('strategic')}
            >
              Estratégico
            </Button>
          </div>
          <span className="text-sm text-muted-foreground">
            {mode === 'quick' 
              ? 'Geração direta com base nos dados do produto' 
              : 'Conversa estratégica para otimizar o anúncio'
            }
          </span>
        </div>
      </div>

      {mode === 'strategic' ? (
        // Modo Estratégico - Chat Interface
        <div className="xl:col-span-12 space-y-6">
          {selectedProductId && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Configuração do Chat</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                  <div>
                    <Label htmlFor="chat-product">Produto</Label>
                    <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                      <SelectTrigger id="chat-product" className="mt-1">
                        <SelectValue placeholder="Selecione um produto..." />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="chat-marketplace">Marketplace</Label>
                    <Select value={selectedMarketplace} onValueChange={(value) => setSelectedMarketplace(value as MarketplaceDestination)}>
                      <SelectTrigger id="chat-marketplace" className="mt-1">
                        <SelectValue placeholder="Selecione marketplace..." />
                      </SelectTrigger>
                      <SelectContent>
                        {MARKETPLACE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-0">
              <AdChatInterface
                productData={selectedProduct}
                marketplace={selectedMarketplace || 'mercado_livre'}
                onResultGenerated={(result) => {
                  console.log('Resultado gerado:', result);
                  setGeneratedResult({ description: result });
                }}
              />
            </CardContent>
          </Card>
        </div>
      ) : (
        // Modo Rápido - Interface Original
        <>
          {/* Alert Informativo */}
          <div className="xl:col-span-12 mb-6">
            <Alert>
              <Info className="w-4 h-4" />
              <AlertDescription>
                Modo rápido: Geração direta baseada nos dados do produto e imagens.
              </AlertDescription>
            </Alert>
          </div>

          {/* Coluna de Configuração (8 colunas) */}
          <div className="xl:col-span-8 space-y-6">
        {/* Card 1: Seleção de Produto */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Selecionar Produto
            </CardTitle>
            <CardDescription>
              Escolha o produto para o qual deseja criar o anúncio
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="product-select">Produto</Label>
                <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                  <SelectTrigger id="product-select" className="mt-1">
                    <SelectValue placeholder="Selecione um produto..." />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-muted-foreground" />
                          <span>{product.name}</span>
                          {product.sku && (
                            <Badge variant="outline" className="text-xs">
                              {product.sku}
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedProduct && (
                <div className="p-3 bg-muted/30 rounded-md">
                  <h4 className="font-medium mb-1">{selectedProduct.name}</h4>
                  {selectedProduct.description && (
                    <p className="text-sm text-muted-foreground">
                      {selectedProduct.description}
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Upload de Imagens */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Imagens do Produto
              <Badge variant="outline">
                {images.length} imagem(ns)
              </Badge>
            </CardTitle>
            <CardDescription>
              Adicione fotos do produto, embalagem e especificações
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Área de Upload */}
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
                  dragOver
                    ? "border-brand-primary bg-brand-primary/5"
                    : "border-muted-foreground/25",
                  !selectedProductId && "opacity-50 pointer-events-none"
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">
                  Arraste imagens aqui ou clique para selecionar
                </p>
                <Input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e.target.files)}
                  className="hidden"
                  id="image-upload"
                  disabled={!selectedProductId}
                />
                <Label
                  htmlFor="image-upload"
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-background border rounded-md cursor-pointer hover:bg-muted"
                >
                  <ImageIcon className="w-4 h-4" />
                  Selecionar Imagens
                </Label>
                <p className="text-xs text-muted-foreground mt-2">
                  Máximo 5MB por imagem. Formatos: JPG, PNG, WebP
                </p>
              </div>

              {/* Grid de Imagens - Responsivo sem scroll interno */}
              {images.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {images.map((image: ProductImage) => (
                    <div key={image.id} className="relative group">
                      <img
                        src={image.image_url}
                        alt="Produto"
                        className="w-full h-24 object-cover rounded-md border"
                      />
                      <div className="absolute inset-0 bg-brand-dark/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex flex-wrap items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => window.open(image.image_url, '_blank')}
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteMutation.mutate(image.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                      <Badge 
                        variant="secondary" 
                        className="absolute top-1 left-1 text-xs"
                      >
                        {image.image_type}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Marketplace e Instruções */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Marketplace */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Marketplace
              </CardTitle>
              <CardDescription>
                Cada plataforma tem características específicas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3">
                {MARKETPLACE_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    variant={selectedMarketplace === option.value ? "default" : "outline"}
                    className="h-auto p-3 flex items-center justify-start gap-3"
                    onClick={() => setSelectedMarketplace(option.value)}
                  >
                    <span className="text-xl">{option.icon}</span>
                    <span className="text-sm font-medium">{option.label}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Instruções Personalizadas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Instruções (Opcional)
              </CardTitle>
              <CardDescription>
                Adicione instruções específicas para a IA
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Ex: Enfatize a durabilidade do produto, mencione garantia de 1 ano..."
                rows={4}
                className="resize-none"
              />
              <div className="mt-2 text-xs text-muted-foreground text-right">
                {customPrompt.length}/500 caracteres
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Coluna de Resultado (4 colunas) - Sticky */}
      <div className="xl:col-span-4">
        <div className="sticky top-6">
          {generatedResult ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wand2 className="w-5 h-5" />
                  Anúncio Gerado
                </CardTitle>
                <CardDescription>
                  Resultado da geração automatizada
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Título */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium">Título</Label>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => navigator.clipboard.writeText(generatedResult.title)}
                    >
                      📋
                    </Button>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-md text-sm">
                    {generatedResult.title}
                  </div>
                </div>
                
                {/* Descrição */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium">Descrição</Label>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => navigator.clipboard.writeText(generatedResult.description)}
                    >
                      📋
                    </Button>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-md text-sm whitespace-pre-wrap max-h-32 overflow-y-auto">
                    {generatedResult.description}
                  </div>
                </div>
                
                {/* Palavras-chave */}
                {generatedResult.keywords && (
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Palavras-chave</Label>
                    <div className="flex flex-wrap gap-1">
                      {generatedResult.keywords.map((keyword: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <Separator />
                
                {/* Botões de Ação */}
                <div className="flex flex-col gap-2">
                  <Button size="sm" className="w-full">
                    <Eye className="w-3 h-3 mr-2" />
                    Visualizar Preview
                  </Button>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Button size="sm" variant="outline">
                      📋 Copiar Tudo
                    </Button>
                    <Button size="sm" variant="outline">
                      💾 Salvar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wand2 className="w-5 h-5" />
                  Resultado
                </CardTitle>
                <CardDescription>
                  O anúncio gerado aparecerá aqui
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p className="text-sm">
                    Configure os campos ao lado e clique em<br />
                    "Gerar Anúncio" para ver o resultado
                  </p>
                </div>
              </CardContent>
            </Card>
           )}
         </div>
       </div>
        </>
      )}
    </ConfigurationPageLayout>
  );
}