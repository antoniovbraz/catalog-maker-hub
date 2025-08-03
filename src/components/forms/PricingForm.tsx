import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { useProducts } from "@/hooks/useProducts";
import { useMarketplaces } from "@/hooks/useMarketplaces";
import { useCalculatePrice, useCalculateMargemReal, useSavePricing } from "@/hooks/usePricing";
import { PricingFormData } from "@/types/pricing";
import { formatarMoeda, formatarPercentual } from "@/utils/pricing";
import { useLogger } from "@/utils/logger";

interface PricingResult {
  custo_total: number;
  valor_fixo: number;
  frete: number;
  comissao: number;
  preco_sugerido: number;
  margem_unitaria: number;
  margem_percentual: number;
  product_name: string;
  product_sku: string;
}

interface MargemRealResult {
  custo_total: number;
  valor_fixo: number;
  frete: number;
  comissao: number;
  preco_praticado: number;
  margem_unitaria_real: number;
  margem_percentual_real: number;
}

export const PricingForm = () => {
  const { toast } = useToast();
  const logger = useLogger('PricingForm');
  const [formData, setFormData] = useState<PricingFormData>({
    product_id: "",
    marketplace_id: "",
    custo_total: 0,
    valor_fixo: 0,
    frete: 0,
    comissao: 0,
    taxa_cartao: 0,
    provisao_desconto: 0,
    margem_desejada: 0,
    preco_praticado: 0
  });
  const [pricingResult, setPricingResult] = useState<PricingResult | null>(null);
  const [margemRealResult, setMargemRealResult] = useState<MargemRealResult | null>(null);


  const { data: products = [], isLoading: loadingProducts } = useProducts();
  const { data: marketplaces = [], isLoading: loadingMarketplaces } = useMarketplaces();
  const calculatePriceMutation = useCalculatePrice();
  const calculateMargemRealMutation = useCalculateMargemReal();
  const savePricingMutation = useSavePricing();

  const handleInputChange = (field: keyof PricingFormData, value: string | number) => {
    if (field === 'product_id' || field === 'marketplace_id') {
      // Manter como string para IDs
      setFormData(prev => ({ ...prev, [field]: value }));
    } else {
      // Converter para número para campos numéricos
      const numericValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
      setFormData(prev => ({ ...prev, [field]: numericValue }));
    }
  };

  const handleCalculate = async () => {
    if (!formData.product_id || !formData.marketplace_id) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione um produto e marketplace",
        variant: "destructive",
      });
      return;
    }


    try {
      const result = await calculatePriceMutation.mutateAsync({
        productId: formData.product_id,
        marketplaceId: formData.marketplace_id,
        taxaCartao: formData.taxa_cartao,
        provisaoDesconto: formData.provisao_desconto,
        margemDesejada: formData.margem_desejada
      });

      

      // Verificar se temos um resultado válido
      if (result && typeof result === 'object') {
        const typedResult = result as PricingResult;
        
        
        setPricingResult(typedResult);
        
        // Atualizar form data com os valores calculados
        setFormData(prev => ({
          ...prev,
          custo_total: typedResult.custo_total || 0,
          valor_fixo: typedResult.valor_fixo || 0,
          frete: typedResult.frete || 0,
          comissao: typedResult.comissao || 0
        }));
        
        // Se há preço praticado, calcular margem real também
        if (formData.preco_praticado > 0) {
          
          
          try {
            const margemResult = await calculateMargemRealMutation.mutateAsync({
              productId: formData.product_id,
              marketplaceId: formData.marketplace_id,
              taxaCartao: formData.taxa_cartao,
              provisaoDesconto: formData.provisao_desconto,
              precoPraticado: formData.preco_praticado
            });

            if (margemResult && typeof margemResult === 'object') {
              setMargemRealResult(margemResult as MargemRealResult);
            }
          } catch (error) {
            logger.error('Erro ao calcular margem real', error);
          }
        }
        
        
      } else {
        
        toast({
          title: "Erro",
          description: "Resposta inválida do servidor",
          variant: "destructive",
        });
      }
    } catch (error) {
      logger.error('Erro ao calcular preço', error);
      toast({
        title: "Erro",
        description: "Erro ao calcular preço. Tente novamente.",
        variant: "destructive",
      });
    }
  };


  const handleSave = async () => {
    if (!pricingResult) {
      toast({
        title: "Erro",
        description: "Nenhum cálculo para salvar",
        variant: "destructive",
      });
      return;
    }

    try {
      await savePricingMutation.mutateAsync({
        ...formData,
        preco_sugerido: pricingResult.preco_sugerido,
        margem_unitaria: pricingResult.margem_unitaria,
        margem_percentual: pricingResult.margem_percentual
      });
    } catch (error) {
      logger.error('Erro ao salvar precificação', error);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Form Section */}
      <Card className="shadow-form border border-border/50">
        <CardHeader className="bg-gradient-primary text-white rounded-t-lg">
          <CardTitle className="text-xl">📊 Calculadora de Preços</CardTitle>
        </CardHeader>
        <CardContent className="space-y-lg p-lg">
          {/* Seção de Seleção */}
          <div className="space-y-md">
            <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
              🎯 Seleção de Produto e Marketplace
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="product" className="text-sm font-medium">Produto *</Label>
              <Select 
                value={formData.product_id} 
                onValueChange={(value) => {
                  
                  handleInputChange("product_id", value);
                }}
              >
                <SelectTrigger className="relative z-0">
                  <SelectValue placeholder="Selecione um produto" />
                </SelectTrigger>
               <SelectContent className="z-[200] bg-popover border shadow-lg">
                 {loadingProducts ? (
                   <div className="px-2 py-1.5 text-sm text-muted-foreground">Carregando...</div>
                 ) : products.length === 0 ? (
                   <div className="px-2 py-1.5 text-sm text-muted-foreground">Nenhum produto encontrado</div>
                 ) : (
                   products.map((product) => (
                     <SelectItem 
                       key={product.id} 
                       value={product.id}
                       className="cursor-pointer hover:bg-accent"
                     >
                       {product.name} {product.sku ? `(${product.sku})` : ''}
                     </SelectItem>
                   ))
                 )}
               </SelectContent>
              </Select>
            </div>

              <div>
                <Label htmlFor="marketplace" className="text-sm font-medium">Marketplace *</Label>
              <Select 
                value={formData.marketplace_id} 
                onValueChange={(value) => {
                  
                  handleInputChange("marketplace_id", value);
                }}
              >
                <SelectTrigger className="relative z-0">
                  <SelectValue placeholder="Selecione um marketplace" />
                </SelectTrigger>
               <SelectContent className="z-[200] bg-popover border shadow-lg">
                 {loadingMarketplaces ? (
                   <div className="px-2 py-1.5 text-sm text-muted-foreground">Carregando...</div>
                 ) : marketplaces.length === 0 ? (
                   <div className="px-2 py-1.5 text-sm text-muted-foreground">Nenhum marketplace encontrado</div>
                 ) : (
                   marketplaces.map((marketplace) => (
                     <SelectItem 
                       key={marketplace.id} 
                       value={marketplace.id}
                       className="cursor-pointer hover:bg-accent"
                     >
                       {marketplace.name}
                     </SelectItem>
                   ))
                 )}
               </SelectContent>
              </Select>
            </div>
            </div>
          </div>

          {/* Seção de Configurações */}
          <div className="space-y-md">
            <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
              ⚙️ Configurações de Margem
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="taxa_cartao" className="text-sm font-medium">Taxa de Cartão (%)</Label>
              <Input
                id="taxa_cartao"
                type="number"
                step="0.01"
                value={formData.taxa_cartao}
                onChange={(e) => handleInputChange("taxa_cartao", e.target.value)}
                placeholder="Ex: 2.5"
              />
            </div>

              <div>
                <Label htmlFor="provisao_desconto" className="text-sm font-medium">Provisão de Desconto (%)</Label>
              <Input
                id="provisao_desconto"
                type="number"
                step="0.01"
                value={formData.provisao_desconto}
                onChange={(e) => handleInputChange("provisao_desconto", e.target.value)}
                placeholder="Ex: 10"
              />
            </div>

              <div>
                <Label htmlFor="margem_desejada" className="text-sm font-medium">Margem Desejada (%)</Label>
              <Input
                id="margem_desejada"
                type="number"
                step="0.01"
                value={formData.margem_desejada}
                onChange={(e) => handleInputChange("margem_desejada", e.target.value)}
                placeholder="Ex: 25"
              />
            </div>
            </div>
          </div>

          {/* Seção de Análise */}
          <div className="space-y-md">
            <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
              📈 Análise de Preço Praticado
            </h3>
            <div>
              <Label htmlFor="preco_praticado" className="text-sm font-medium">Preço de Venda Praticado (R$) - Opcional</Label>
            <Input
              id="preco_praticado"
              type="number"
              step="0.01"
              value={formData.preco_praticado}
              onChange={(e) => handleInputChange("preco_praticado", e.target.value)}
              placeholder="Ex: 199.90"
            />
            </div>
          </div>
          
          {/* Botões de Ação */}
          <div className="flex gap-3 pt-4 border-t border-border">
              <Button
                onClick={handleCalculate}
                disabled={calculatePriceMutation.isPending || calculateMargemRealMutation.isPending}
                className="flex-1 h-11 bg-gradient-primary hover:opacity-90 shadow-hover"
              >
              {(calculatePriceMutation.isPending || calculateMargemRealMutation.isPending) ? "Calculando..." : "🧮 Calcular Preço"}
            </Button>
            
            {pricingResult && (
              <Button 
                onClick={handleSave}
                disabled={savePricingMutation.isPending}
                variant="secondary"
                className="h-11 min-w-[120px] shadow-form"
              >
                {savePricingMutation.isPending ? "Salvando..." : "💾 Salvar"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      <Card className="shadow-form border border-border/50">
        <CardHeader className="bg-gradient-card text-white rounded-t-lg">
          <CardTitle className="text-xl">📊 Resultado do Cálculo</CardTitle>
        </CardHeader>
        <CardContent className="p-lg">
          {pricingResult ? (
            <div className="space-y-md">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Produto:</div>
                <div className="font-medium">{pricingResult.product_name || 'N/A'}</div>
                
                <div>SKU:</div>
                <div className="font-medium">{pricingResult.product_sku || 'N/A'}</div>
                
                <Separator className="col-span-2 my-2" />
                
                <div>Custo Total:</div>
                <div className="font-medium">{formatarMoeda(pricingResult.custo_total || 0)}</div>
                
                <div>Valor Fixo:</div>
                <div className="font-medium">{formatarMoeda(pricingResult.valor_fixo || 0)}</div>
                
                <div>Frete:</div>
                <div className="font-medium">{formatarMoeda(pricingResult.frete || 0)}</div>
                
                <div>Comissão:</div>
                <div className="font-medium">{formatarPercentual(pricingResult.comissao || 0)}</div>
                
                <Separator className="col-span-2 my-2" />
                
                <div className="text-lg font-bold text-primary">Preço Sugerido:</div>
                <div className="text-lg font-bold text-primary">{formatarMoeda(pricingResult.preco_sugerido || 0)}</div>
                
                <div className="font-semibold">Margem Unitária:</div>
                <div className="font-semibold">{formatarMoeda(pricingResult.margem_unitaria || 0)}</div>
                
                <div className="font-semibold">Margem Percentual:</div>
                <div className="font-semibold">{formatarPercentual(pricingResult.margem_percentual || 0)}</div>
              </div>

              {/* Seção de Margem Real - só aparece se houver cálculo */}
              {margemRealResult && (
                <>
                  <Separator className="my-4" />
                  <div className="bg-muted/50 p-md rounded-lg">
                    <h4 className="font-semibold mb-3 text-orange-600 dark:text-orange-400">
                      📊 Análise do Preço Praticado
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>Preço Praticado:</div>
                      <div className="font-medium text-orange-600 dark:text-orange-400">
                        {formatarMoeda(margemRealResult.preco_praticado || 0)}
                      </div>
                      
                      <div>Margem Real Unitária:</div>
                      <div className="font-medium">
                        {formatarMoeda(margemRealResult.margem_unitaria_real || 0)}
                      </div>
                      
                      <div>Margem Real Percentual:</div>
                      <div className={`font-medium ${
                        (margemRealResult.margem_percentual_real || 0) < 0 
                          ? 'text-destructive' 
                          : 'text-green-600 dark:text-green-400'
                      }`}>
                        {formatarPercentual(margemRealResult.margem_percentual_real || 0)}
                      </div>
                      
                      {/* Indicador de comparação */}
                      <div className="col-span-2 mt-2 pt-2 border-t">
                        <div className="text-xs text-muted-foreground">
                          {(margemRealResult.margem_percentual_real || 0) < (pricingResult.margem_percentual || 0) ? (
                            <span className="text-amber-600 dark:text-amber-400">
                              ⚠️ Margem real é menor que a desejada
                            </span>
                          ) : (
                            <span className="text-green-600 dark:text-green-400">
                              ✅ Margem real está dentro do esperado
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              Preencha os campos e clique em "Calcular" para ver os resultados
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};