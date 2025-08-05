import { useState } from "react";
import { ConfigurationPageLayout } from "@/components/layout/ConfigurationPageLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Wand2, 
  Sparkles,
  Info,
  Package,
  ShoppingCart
} from "@/components/ui/icons";
import { useProducts } from "@/hooks/useProducts";
import { useGenerateListing } from "@/hooks/useAdGeneration";
import { AdChatInterface } from "@/components/forms/AdChatInterface";
import { MarketplaceDestination } from "@/types/ads";
import { useToast } from "@/components/ui/use-toast";

const MARKETPLACE_OPTIONS = [
  { value: 'mercado_livre', label: 'Mercado Livre', icon: '🛒', color: 'bg-mercado-livre' },
  { value: 'shopee', label: 'Shopee', icon: '🛍️', color: 'bg-shopee' },
  { value: 'instagram', label: 'Instagram', icon: '📸', color: 'bg-instagram' },
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

  const { data: products = [], isLoading: productsLoading } = useProducts();
  const selectedProduct = products.find(p => p.id === selectedProductId);

  const generateMutation = useGenerateListing();

  const handleQuickGenerate = async () => {
    if (!selectedProductId || !selectedMarketplace) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione um produto e marketplace antes de gerar.",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await generateMutation.mutateAsync({
        product_id: selectedProductId,
        marketplace: selectedMarketplace,
        image_urls: [],
      });

      setGeneratedResult({ description: typeof result === 'string' ? result : result.description });
      toast({
        title: "Anúncio gerado!",
        description: "O anúncio foi gerado com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao gerar anúncio:', error);
    }
  };

  const isStrategicFormValid = mode === 'strategic' && selectedProductId && selectedMarketplace;
  const isQuickFormValid = selectedProductId && selectedMarketplace;

  const breadcrumbs = [
    { label: "Dashboard", href: "/" },
    { label: "Gerador de IA", href: "/ad-generator" }
  ];

  return (
    <ConfigurationPageLayout
      title="Gerador de Anúncios IA"
      description="Gere anúncios otimizados usando inteligência artificial"
      breadcrumbs={breadcrumbs}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:col-span-12">
        {/* Configuração */}
        <div className="lg:col-span-1 space-y-6">
          {/* Seleção de Modo */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold">Modo de Geração</CardTitle>
              <CardDescription>
                Escolha entre geração rápida ou estratégica
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant={mode === 'quick' ? 'default' : 'outline'}
                  onClick={() => setMode('quick')}
                  className="h-auto p-3 flex flex-col items-center gap-2"
                >
                  <Wand2 className="h-4 w-4" />
                  <span className="text-sm font-medium">Rápido</span>
                </Button>
                <Button
                  variant={mode === 'strategic' ? 'default' : 'outline'}
                  onClick={() => setMode('strategic')}
                  className="h-auto p-3 flex flex-col items-center gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  <span className="text-sm font-medium">Estratégico</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Seleção de Produto e Marketplace - Sempre visível */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold">Configuração</CardTitle>
              <CardDescription>
                Selecione o produto e marketplace para gerar o anúncio
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Produto */}
              <div className="space-y-2">
                <Label htmlFor="product" className="text-sm font-medium">Produto</Label>
                <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                  <SelectTrigger id="product">
                    <SelectValue placeholder="Selecione um produto" />
                  </SelectTrigger>
                  <SelectContent>
                    {productsLoading ? (
                      <SelectItem value="loading" disabled>
                        Carregando produtos...
                      </SelectItem>
                    ) : products.length === 0 ? (
                      <SelectItem value="empty" disabled>
                        Nenhum produto cadastrado
                      </SelectItem>
                    ) : (
                      products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <span>{product.name}</span>
                            {product.sku && (
                              <Badge variant="secondary" className="text-xs">
                                {product.sku}
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Marketplace */}
              <div className="space-y-2">
                <Label htmlFor="marketplace" className="text-sm font-medium">Marketplace</Label>
                <Select value={selectedMarketplace} onValueChange={(value) => setSelectedMarketplace(value as MarketplaceDestination)}>
                  <SelectTrigger id="marketplace">
                    <SelectValue placeholder="Selecione o marketplace" />
                  </SelectTrigger>
                  <SelectContent>
                    {MARKETPLACE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <span>{option.icon}</span>
                          <span>{option.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Produto Selecionado Info */}
              {selectedProduct && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <h4 className="text-sm font-semibold mb-2">Produto Selecionado</h4>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p><strong>Nome:</strong> {selectedProduct.name}</p>
                    {selectedProduct.sku && (
                      <p><strong>SKU:</strong> {selectedProduct.sku}</p>
                    )}
                    <p><strong>Custo:</strong> R$ {selectedProduct.cost_unit.toFixed(2)}</p>
                    {selectedProduct.description && (
                      <p><strong>Descrição:</strong> {selectedProduct.description.slice(0, 100)}...</p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Geração Rápida */}
          {mode === 'quick' && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold">Geração Rápida</CardTitle>
                <CardDescription>
                  Gere um anúncio instantaneamente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="prompt" className="text-sm font-medium">Prompt Personalizado (Opcional)</Label>
                  <Textarea
                    id="prompt"
                    placeholder="Ex: Destaque a durabilidade e qualidade premium..."
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    className="min-h-[80px] resize-none"
                  />
                </div>

                <Button
                  onClick={handleQuickGenerate}
                  disabled={!isQuickFormValid || generateMutation.isPending}
                  className="w-full"
                >
                  {generateMutation.isPending ? (
                    <>
                      <Wand2 className="h-4 w-4 mr-2 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      Gerar Anúncio
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Informação de Configuração para Modo Estratégico */}
          {mode === 'strategic' && !isStrategicFormValid && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Configure o produto e marketplace acima para iniciar a geração estratégica.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Chat Estratégico ou Resultado */}
        <div className="lg:col-span-2">
          {mode === 'strategic' && isStrategicFormValid ? (
            <Card className="h-[600px]">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Geração Estratégica
                </CardTitle>
                <CardDescription>
                  Converse com a IA para criar anúncios personalizados
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[calc(100%-100px)]">
                <AdChatInterface
                  productData={selectedProduct}
                  marketplace={selectedMarketplace || 'mercado_livre'}
                  onResultGenerated={(result) => {
                    console.log('Resultado gerado:', result);
                    setGeneratedResult({ description: result as string });
                  }}
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold">Resultado</CardTitle>
                <CardDescription>
                  O anúncio gerado aparecerá aqui
                </CardDescription>
              </CardHeader>
              <CardContent>
                {generatedResult ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <h4 className="text-sm font-semibold mb-2">Anúncio Gerado</h4>
                      <div className="whitespace-pre-wrap text-sm">
                        {generatedResult.description}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => navigator.clipboard.writeText(generatedResult.description)}
                        className="flex-1"
                      >
                        Copiar Texto
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setGeneratedResult(null)}
                        className="flex-1"
                      >
                        Limpar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum anúncio gerado ainda</p>
                    <p className="text-sm mt-1">
                      {mode === 'quick' 
                        ? 'Use a geração rápida para criar um anúncio instantaneamente'
                        : 'Configure produto e marketplace para iniciar a geração estratégica'
                      }
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </ConfigurationPageLayout>
  );
}