import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

interface Product {
  id: string;
  name: string;
  sku: string;
}

interface Marketplace {
  id: string;
  name: string;
}

interface PricingFormData {
  product_id: string;
  marketplace_id: string;
  taxa_cartao: number;
  provisao_desconto: number;
  margem_desejada: number;
  preco_praticado: number;
}

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

interface MarginResult {
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
  const [formData, setFormData] = useState<PricingFormData>({
    product_id: "",
    marketplace_id: "",
    taxa_cartao: 0,
    provisao_desconto: 0,
    margem_desejada: 0,
    preco_praticado: 0,
  });
  const [pricingResult, setPricingResult] = useState<PricingResult | null>(null);
  const [marginResult, setMarginResult] = useState<MarginResult | null>(null);

  // Fetch products
  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, sku")
        .order("name");
      if (error) throw error;
      return data as Product[];
    },
  });

  // Fetch marketplaces
  const { data: marketplaces = [], isLoading: loadingMarketplaces } = useQuery({
    queryKey: ["marketplaces"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketplaces")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data as Marketplace[];
    },
  });

  // Calculate price mutation
  const calculatePriceMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("calcular_preco", {
        p_product_id: formData.product_id,
        p_marketplace_id: formData.marketplace_id,
        p_taxa_cartao: formData.taxa_cartao,
        p_provisao_desconto: formData.provisao_desconto,
        p_margem_desejada: formData.margem_desejada,
      });
      if (error) throw error;
      return data as unknown as PricingResult;
    },
    onSuccess: (data) => {
      if ('error' in data) {
        toast({
          title: "Erro",
          description: data.error as string,
          variant: "destructive",
        });
      } else {
        setPricingResult(data);
        setMarginResult(null);
        toast({
          title: "Sucesso",
          description: "Preço calculado com sucesso!",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao calcular preço: " + error.message,
        variant: "destructive",
      });
    },
  });

  // Calculate real margin mutation
  const calculateMarginMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("calcular_margem_real", {
        p_product_id: formData.product_id,
        p_marketplace_id: formData.marketplace_id,
        p_taxa_cartao: formData.taxa_cartao,
        p_provisao_desconto: formData.provisao_desconto,
        p_preco_praticado: formData.preco_praticado,
      });
      if (error) throw error;
      return data as unknown as MarginResult;
    },
    onSuccess: (data) => {
      if ('error' in data) {
        toast({
          title: "Erro",
          description: data.error as string,
          variant: "destructive",
        });
      } else {
        setMarginResult(data);
        toast({
          title: "Sucesso",
          description: "Margem real calculada com sucesso!",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao calcular margem real: " + error.message,
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (field: keyof PricingFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCalculatePrice = () => {
    if (!formData.product_id || !formData.marketplace_id) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione um produto e marketplace",
        variant: "destructive",
      });
      return;
    }
    calculatePriceMutation.mutate();
  };

  const handleCalculateMargin = () => {
    if (!formData.product_id || !formData.marketplace_id || !formData.preco_praticado) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione um produto, marketplace e informe o preço praticado",
        variant: "destructive",
      });
      return;
    }
    calculateMarginMutation.mutate();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Form Section */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="product">Produto *</Label>
            <Select 
              value={formData.product_id} 
              onValueChange={(value) => handleInputChange("product_id", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um produto" />
              </SelectTrigger>
              <SelectContent>
                {loadingProducts ? (
                  <SelectItem value="loading">Carregando...</SelectItem>
                ) : (
                  products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} ({product.sku})
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
              onValueChange={(value) => handleInputChange("marketplace_id", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um marketplace" />
              </SelectTrigger>
              <SelectContent>
                {loadingMarketplaces ? (
                  <SelectItem value="loading">Carregando...</SelectItem>
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="taxa_cartao">Taxa de Cartão (%)</Label>
            <Input
              id="taxa_cartao"
              type="number"
              step="0.01"
              value={formData.taxa_cartao}
              onChange={(e) => handleInputChange("taxa_cartao", parseFloat(e.target.value) || 0)}
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
              onChange={(e) => handleInputChange("provisao_desconto", parseFloat(e.target.value) || 0)}
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
              onChange={(e) => handleInputChange("margem_desejada", parseFloat(e.target.value) || 0)}
              placeholder="Ex: 25"
            />
          </div>
        </div>

        <Button 
          onClick={handleCalculatePrice} 
          disabled={calculatePriceMutation.isPending}
          className="w-full"
        >
          {calculatePriceMutation.isPending ? "Calculando..." : "Calcular Preço"}
        </Button>

        <Separator />

        <div>
          <Label htmlFor="preco_praticado">Preço de Venda Praticado (R$)</Label>
          <Input
            id="preco_praticado"
            type="number"
            step="0.01"
            value={formData.preco_praticado}
            onChange={(e) => handleInputChange("preco_praticado", parseFloat(e.target.value) || 0)}
            placeholder="Ex: 199.90"
          />
        </div>

        <Button 
          onClick={handleCalculateMargin} 
          disabled={calculateMarginMutation.isPending}
          variant="outline"
          className="w-full"
        >
          {calculateMarginMutation.isPending ? "Calculando..." : "Calcular Margem Real"}
        </Button>
      </div>

      {/* Results Section */}
      <div className="space-y-4">
        {pricingResult && (
          <div className="space-y-3">
            <h4 className="font-semibold text-lg">Preço Sugerido</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Produto:</div>
              <div className="font-medium">{pricingResult.product_name}</div>
              
              <div>SKU:</div>
              <div className="font-medium">{pricingResult.product_sku}</div>
              
              <div>Custo Total:</div>
              <div className="font-medium">R$ {pricingResult.custo_total.toFixed(2)}</div>
              
              <div>Valor Fixo:</div>
              <div className="font-medium">R$ {pricingResult.valor_fixo.toFixed(2)}</div>
              
              <div>Frete:</div>
              <div className="font-medium">R$ {pricingResult.frete.toFixed(2)}</div>
              
              <div>Comissão:</div>
              <div className="font-medium">{pricingResult.comissao.toFixed(2)}%</div>
              
              <div className="text-lg font-bold text-primary">Preço Sugerido:</div>
              <div className="text-lg font-bold text-primary">R$ {pricingResult.preco_sugerido.toFixed(2)}</div>
              
              <div className="font-semibold">Margem Unitária:</div>
              <div className="font-semibold">R$ {pricingResult.margem_unitaria.toFixed(2)}</div>
              
              <div className="font-semibold">Margem Percentual:</div>
              <div className="font-semibold">{pricingResult.margem_percentual.toFixed(2)}%</div>
            </div>
          </div>
        )}

        {marginResult && (
          <div className="space-y-3">
            <Separator />
            <h4 className="font-semibold text-lg">Margem Real</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Custo Total:</div>
              <div className="font-medium">R$ {marginResult.custo_total.toFixed(2)}</div>
              
              <div>Valor Fixo:</div>
              <div className="font-medium">R$ {marginResult.valor_fixo.toFixed(2)}</div>
              
              <div>Frete:</div>
              <div className="font-medium">R$ {marginResult.frete.toFixed(2)}</div>
              
              <div>Comissão:</div>
              <div className="font-medium">{marginResult.comissao.toFixed(2)}%</div>
              
              <div className="text-lg font-bold">Preço Praticado:</div>
              <div className="text-lg font-bold">R$ {marginResult.preco_praticado.toFixed(2)}</div>
              
              <div className="font-semibold text-green-600">Margem Real Unitária:</div>
              <div className="font-semibold text-green-600">R$ {marginResult.margem_unitaria_real.toFixed(2)}</div>
              
              <div className="font-semibold text-green-600">Margem Real Percentual:</div>
              <div className="font-semibold text-green-600">{marginResult.margem_percentual_real.toFixed(2)}%</div>
            </div>
          </div>
        )}

        {!pricingResult && !marginResult && (
          <div className="text-center text-muted-foreground py-8">
            Preencha os campos e clique em "Calcular" para ver os resultados
          </div>
        )}
      </div>
    </div>
  );
};