import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useProducts } from "@/hooks/useProducts";
import { useMarketplacePlatforms, useMarketplaceModalities } from "@/hooks/useMarketplaces";
import { useCalculatePrice, useCalculateMargemReal, useSavePricing } from "@/hooks/usePricing";
import { PricingFormData } from "@/types/pricing";
import { useLogger } from "@/utils/logger";
import { CollapsibleCard } from "@/components/ui/collapsible-card";
import { useCollapsibleSection } from "@/hooks/useCollapsibleSection";
import { TrendingUp } from "@/components/ui/icons";

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

interface PricingCalculatorModalProps {
  onCalculationComplete: (result: PricingResult, margemReal?: MargemRealResult) => void;
}

export const PricingCalculatorModal = ({ onCalculationComplete }: PricingCalculatorModalProps) => {
  const { toast } = useToast();
  const logger = useLogger('PricingCalculatorModal');
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
  const [selectedPlatform, setSelectedPlatform] = useState<string>("");

  const { data: products = [], isLoading: loadingProducts } = useProducts();
  const { data: platforms = [], isLoading: loadingPlatforms } = useMarketplacePlatforms();
  
  const selectedProduct = products.find(p => p.id === formData.product_id);
  const { data: modalities = [], isLoading: loadingModalities } = useMarketplaceModalities(
    selectedPlatform, 
    selectedProduct?.category_id
  );

  const calculatePriceMutation = useCalculatePrice();
  const calculateMargemRealMutation = useCalculateMargemReal();
  const savePricingMutation = useSavePricing();

  const analysisSection = useCollapsibleSection({ 
    storageKey: 'modal-pricing-analysis-section', 
    defaultOpen: false 
  });

  const handleInputChange = (field: keyof PricingFormData, value: string | number) => {
    if (field === 'product_id' || field === 'marketplace_id') {
      setFormData(prev => ({ ...prev, [field]: value }));
    } else {
      const numericValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
      setFormData(prev => ({ ...prev, [field]: numericValue }));
    }
  };

  const handleCalculateAndSave = async () => {
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

      if (result && typeof result === 'object') {
        const typedResult = result as unknown as PricingResult;
        
        let margemRealResult: MargemRealResult | undefined;
        
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
              margemRealResult = margemResult as unknown as MargemRealResult;
            }
          } catch (error) {
            logger.error('Erro ao calcular margem real', error instanceof Error ? error : new Error(String(error)));
          }
        }

        // Salvar automaticamente após calcular
        await savePricingMutation.mutateAsync({
          ...formData,
          custo_total: typedResult.custo_total || 0,
          valor_fixo: typedResult.valor_fixo || 0,
          frete: typedResult.frete || 0,
          comissao: typedResult.comissao || 0,
          preco_sugerido: typedResult.preco_sugerido,
          margem_unitaria: typedResult.margem_unitaria,
          margem_percentual: typedResult.margem_percentual
        });

        // Notificar o componente pai com os resultados
        onCalculationComplete(typedResult, margemRealResult);
        
        toast({
          title: "Sucesso",
          description: "Preço calculado e salvo com sucesso!",
        });
      }
    } catch (error) {
      logger.error('Erro ao calcular e salvar preço', error instanceof Error ? error : new Error(String(error)));
      toast({
        title: "Erro",
        description: "Erro ao calcular preço. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Seleção de Produto e Marketplace */}
      <div className="space-y-4">
        <h3 className="border-b border-border pb-2 text-lg font-semibold text-foreground">
          Seleção de Produto e Marketplace
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="product" className="text-sm font-medium">Produto *</Label>
            <Select 
              value={formData.product_id} 
              onValueChange={(value) => handleInputChange("product_id", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um produto" />
              </SelectTrigger>
              <SelectContent>
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
            <Label htmlFor="platform" className="text-sm font-medium">Plataforma *</Label>
            <Select 
              value={selectedPlatform} 
              onValueChange={(value) => {
                setSelectedPlatform(value);
                handleInputChange("marketplace_id", "");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma plataforma" />
              </SelectTrigger>
              <SelectContent>
                {loadingPlatforms ? (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">Carregando...</div>
                ) : platforms.length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">Nenhuma plataforma encontrada</div>
                ) : (
                  platforms.map((platform) => (
                    <SelectItem key={platform.id} value={platform.id}>
                      {platform.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {selectedPlatform && (
          <div>
            <Label htmlFor="marketplace" className="text-sm font-medium">Modalidade *</Label>
            <Select 
              value={formData.marketplace_id} 
              onValueChange={(value) => handleInputChange("marketplace_id", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma modalidade" />
              </SelectTrigger>
              <SelectContent>
                {loadingModalities ? (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">Carregando...</div>
                ) : modalities.length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    {selectedProduct?.category_id 
                      ? "Nenhuma modalidade disponível para esta categoria" 
                      : "Nenhuma modalidade encontrada"}
                  </div>
                ) : (
                  modalities.map((modality) => (
                    <SelectItem key={modality.id} value={modality.id}>
                      {modality.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Configurações de Margem */}
      <div className="space-y-4">
        <h3 className="border-b border-border pb-2 text-lg font-semibold text-foreground">
          Configurações de Margem
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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

      {/* Análise de Preço Praticado */}
      <CollapsibleCard
        title="Análise de Preço Praticado"
        icon={<TrendingUp className="size-4" />}
        isOpen={analysisSection.isOpen}
        onToggle={analysisSection.toggle}
      >
        <div>
          <Label htmlFor="preco_praticado" className="text-sm font-medium">
            Preço de Venda Praticado (R$) - Opcional
          </Label>
          <Input
            id="preco_praticado"
            type="number"
            step="0.01"
            value={formData.preco_praticado}
            onChange={(e) => handleInputChange("preco_praticado", e.target.value)}
            placeholder="Ex: 199.90"
            className="mt-1"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Compare sua margem real com a desejada
          </p>
        </div>
      </CollapsibleCard>
      
      {/* Botão de Ação */}
      <div className="flex justify-end border-t border-border pt-4">
        <Button
          onClick={handleCalculateAndSave}
          disabled={calculatePriceMutation.isPending || calculateMargemRealMutation.isPending || savePricingMutation.isPending}
        >
          {(calculatePriceMutation.isPending || calculateMargemRealMutation.isPending || savePricingMutation.isPending) 
            ? "Calculando..." 
            : "Calcular e Salvar"
          }
        </Button>
      </div>
    </div>
  );
};