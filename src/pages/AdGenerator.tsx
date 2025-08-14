import { useState } from "react";
import { ConfigurationPageLayout } from "@/components/layout/ConfigurationPageLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Wand2, 
  Sparkles,
  Info,
  Package,
  ShoppingCart,
  Eye,
  Copy,
  Save
} from "@/components/ui/icons";
import { useProducts } from "@/hooks/useProducts";
import { useGenerateListing } from "@/hooks/useAdGeneration";
import { AdChatInterface } from "@/components/forms/AdChatInterface";
import { MarketplaceDestination } from "@/types/ads";
import { useToast } from "@/components/ui/use-toast";

const MARKETPLACE_OPTIONS = [
  { value: 'mercado_livre', label: 'Mercado Livre', icon: '🛒', color: 'bg-yellow-500' },
  { value: 'shopee', label: 'Shopee', icon: '🛍️', color: 'bg-orange-500' },
  { value: 'instagram', label: 'Instagram', icon: '📸', color: 'bg-pink-500' },
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
  const [mode, setMode] = useState<'quick' | 'strategic'>('quick');

  const { data: products = [] } = useProducts();
  const generateMutation = useGenerateListing();

  const selectedProduct = products.find(p => p.id === selectedProductId);


  const handleGenerate = async () => {
    if (!selectedProductId || !selectedMarketplace) {
      toast({
        title: "Dados incompletos",
        description: "Selecione um produto e marketplace.",
        variant: "destructive"
      });
      return;
    }

    try {
      const result = await generateMutation.mutateAsync({
        product_id: selectedProductId,
        marketplace: selectedMarketplace,
        image_urls: [],
        custom_prompt: customPrompt || undefined
      });
      
      setGeneratedResult(result);
    } catch (error) {
      console.error('Erro na geração:', error);
    }
  };

  const canGenerate = selectedProductId && selectedMarketplace;

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
            <Wand2 className="mr-2 size-4" />
            {generateMutation.isPending ? "Gerando..." : "Gerar Anúncio"}
          </Button>
        ) : null
      }
    >
      {/* Mode Toggle */}
      <div className="mb-6 xl:col-span-12">
        <div className="flex items-center gap-4 rounded-lg bg-muted/50 p-4">
          <span className="font-medium">Modo de Geração:</span>
          <div className="flex gap-2">
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
        <div className="space-y-6 xl:col-span-12">
          {selectedProductId && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Configuração do Chat</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4 grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
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
                  setGeneratedResult({ description: String(result) });
                }}
              />
            </CardContent>
          </Card>
        </div>
      ) : (
        // Modo Rápido - Interface Original
        <>
          {/* Alert Informativo */}
          <div className="mb-6 xl:col-span-12">
          <Alert>
            <Info className="size-4" />
            <AlertDescription>
              Modo rápido: Geração direta baseada nos dados do produto.
            </AlertDescription>
          </Alert>
          </div>

          {/* Coluna de Configuração (8 colunas) */}
          <div className="space-y-6 xl:col-span-8">
        {/* Card 1: Seleção de Produto */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="size-5" />
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
                          <Package className="size-4 text-muted-foreground" />
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
                <div className="rounded-md bg-muted/30 p-3">
                  <h4 className="mb-1 font-medium">{selectedProduct.name}</h4>
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


        {/* Card 2: Marketplace e Instruções */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Marketplace */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="size-5" />
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
                    className="flex h-auto items-center justify-start gap-3 p-3"
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
                <Sparkles className="size-5" />
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
              <div className="mt-2 text-right text-xs text-muted-foreground">
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
                  <Wand2 className="size-5" />
                  Anúncio Gerado
                </CardTitle>
                <CardDescription>
                  Resultado da geração automatizada
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Título */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <Label className="text-sm font-medium">Título</Label>
                     <Button
                       size="sm"
                       variant="ghost"
                       onClick={() => navigator.clipboard.writeText(generatedResult.title || "")}
                     >
                       <Copy className="size-3" />
                     </Button>
                  </div>
                  <div className="rounded-md bg-muted/30 p-3 text-sm">
                    {generatedResult.title}
                  </div>
                </div>
                
                {/* Descrição */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <Label className="text-sm font-medium">Descrição</Label>
                     <Button
                       size="sm"
                       variant="ghost"
                       onClick={() => navigator.clipboard.writeText(generatedResult.description)}
                     >
                       <Copy className="size-3" />
                     </Button>
                  </div>
                  <div className="max-h-32 overflow-y-auto whitespace-pre-wrap rounded-md bg-muted/30 p-3 text-sm">
                    {generatedResult.description}
                  </div>
                </div>
                
                {/* Palavras-chave */}
                {generatedResult.keywords && (
                  <div>
                    <Label className="mb-2 block text-sm font-medium">Palavras-chave</Label>
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
                   <div className="grid grid-cols-2 gap-2">
                     <Button size="sm" variant="outline">
                       <Copy className="mr-2 size-3" />
                       Copiar Tudo
                     </Button>
                     <Button size="sm" variant="outline">
                       <Save className="mr-2 size-3" />
                       Salvar
                     </Button>
                   </div>
                 </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wand2 className="size-5" />
                  Resultado
                </CardTitle>
                <CardDescription>
                  O anúncio gerado aparecerá aqui
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="py-8 text-center text-muted-foreground">
                  <Sparkles className="mx-auto mb-4 size-12 opacity-30" />
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