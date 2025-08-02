import { useState } from "react";
import { Calculator } from "lucide-react";
import { SmartForm } from "@/components/ui/smart-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
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

function PricingForm() {
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Form Section */}
      <Card>
        <CardHeader>
          <CardTitle>Calculadora de Preços</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="product">Produto *</Label>
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
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} {product.sku ? `(${product.sku})` : ''}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="marketplace">Marketplace *</Label>
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
                      <SelectItem key={marketplace.id} value={marketplace.id}>
                        {marketplace.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="taxa_cartao">Taxa de Cartão (%)</Label>
              <Input
                id="taxa_cartao"
                type="number"
                step="0.01"
                value={formData.taxa_cartao}
                onChange={(e) => handleInputChange("taxa_cartao", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="provisao_desconto">Provisão para Desconto (%)</Label>
              <Input
                id="provisao_desconto"
                type="number"
                step="0.01"
                value={formData.provisao_desconto}
                onChange={(e) => handleInputChange("provisao_desconto", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="margem_desejada">Margem Desejada (%)</Label>
              <Input
                id="margem_desejada"
                type="number"
                step="0.01"
                value={formData.margem_desejada}
                onChange={(e) => handleInputChange("margem_desejada", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="preco_praticado">Preço Praticado (R$)</Label>
              <Input
                id="preco_praticado"
                type="number"
                step="0.01"
                value={formData.preco_praticado}
                onChange={(e) => handleInputChange("preco_praticado", e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              onClick={handleCalculate}
              disabled={calculatePriceMutation.isPending}
            >
              Calcular
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleSave}
              disabled={!pricingResult || savePricingMutation.isPending}
            >
              Salvar Configuração
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      <Card>
        <CardHeader>
          <CardTitle>Resultados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {pricingResult ? (
            <div className="space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Preço Sugerido</p>
                <p className="text-2xl font-bold">{formatarMoeda(pricingResult.preco_sugerido)}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-sm text-muted-foreground">Margem Unitária</p>
                  <p className="text-lg">{formatarMoeda(pricingResult.margem_unitaria)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Margem %</p>
                  <p className="text-lg">{formatarPercentual(pricingResult.margem_percentual)}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-center text-muted-foreground">Nenhum resultado disponível</p>
          )}

          {margemRealResult && (
            <div className="mt-4">
              <Separator className="my-4" />
              <h4 className="text-sm font-medium">Margem Real com Preço Praticado</h4>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <p className="text-sm text-muted-foreground">Margem Unitária Real</p>
                  <p className="text-lg">{formatarMoeda(margemRealResult.margem_unitaria_real)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Margem % Real</p>
                  <p className="text-lg">{formatarPercentual(margemRealResult.margem_percentual_real)}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function PricingFormEnhanced() {
  const sections = [
    {
      id: "calculadora",
      title: "Calculadora de Preços",
      description: "Configure custos, margens e marketplace para calcular preços sugeridos",
      icon: <Calculator className="h-5 w-5" />,
      children: (
        <PricingForm />
      )
    }
  ];

  return (
    <SmartForm
      title="Calculadora de Precificação"
      sections={sections}
    />
  );
}