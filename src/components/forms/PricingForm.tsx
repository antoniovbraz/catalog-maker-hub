import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useProducts } from "@/hooks/useProducts";
import { useMarketplaces } from "@/hooks/useMarketplaces";
import { useCalculatePrice, useSavePricing } from "@/hooks/usePricing";
import { PricingFormData } from "@/types/pricing";
import { formatarMoeda, formatarPercentual } from "@/utils/pricing";

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

export const PricingForm = () => {
  const { toast } = useToast();
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

  const { data: products = [], isLoading: loadingProducts } = useProducts();
  const { data: marketplaces = [], isLoading: loadingMarketplaces } = useMarketplaces();
  const calculatePriceMutation = useCalculatePrice();
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

      if (typeof result === 'object' && result !== null) {
        setPricingResult(result as PricingResult);
        // Atualizar form data com os valores calculados
        setFormData(prev => ({
          ...prev,
          custo_total: (result as any).custo_total || 0,
          valor_fixo: (result as any).valor_fixo || 0,
          frete: (result as any).frete || 0,
          comissao: (result as any).comissao || 0
        }));
      }
    } catch (error) {
      console.error('Erro ao calcular preço:', error);
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
      console.error('Erro ao salvar precificação:', error);
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
                  console.log('Product selected:', value);
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
              <Label htmlFor="marketplace">Marketplace *</Label>
              <Select 
                value={formData.marketplace_id} 
                onValueChange={(value) => {
                  console.log('Marketplace selected:', value);
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="taxa_cartao">Taxa de Cartão (%)</Label>
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
              <Label htmlFor="provisao_desconto">Provisão de Desconto (%)</Label>
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
              <Label htmlFor="margem_desejada">Margem Desejada (%)</Label>
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

          <div>
            <Label htmlFor="preco_praticado">Preço de Venda Praticado (R$) - Opcional</Label>
            <Input
              id="preco_praticado"
              type="number"
              step="0.01"
              value={formData.preco_praticado}
              onChange={(e) => handleInputChange("preco_praticado", e.target.value)}
              placeholder="Ex: 199.90"
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={handleCalculate}
              disabled={calculatePriceMutation.isPending}
              className="flex-1"
            >
              {calculatePriceMutation.isPending ? "Calculando..." : "Calcular Preço"}
            </Button>
            
            {pricingResult && (
              <Button 
                onClick={handleSave}
                disabled={savePricingMutation.isPending}
                variant="secondary"
              >
                {savePricingMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      <Card>
        <CardHeader>
          <CardTitle>Resultado do Cálculo</CardTitle>
        </CardHeader>
        <CardContent>
          {pricingResult ? (
            <div className="space-y-3">
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