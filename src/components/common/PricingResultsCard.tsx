import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Calculator, Plus, RefreshCw } from "@/components/ui/icons";
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

interface MargemRealResult {
  custo_total: number;
  valor_fixo: number;
  frete: number;
  comissao: number;
  preco_praticado: number;
  margem_unitaria_real: number;
  margem_percentual_real: number;
}

interface PricingResultsCardProps {
  pricingResult?: PricingResult;
  margemRealResult?: MargemRealResult;
  onCalculateClick: () => void;
}

export const PricingResultsCard = ({ 
  pricingResult, 
  margemRealResult, 
  onCalculateClick 
}: PricingResultsCardProps) => {
  const hasResults = !!pricingResult;

  return (
    <Card className="border border-border/50 shadow-card">
      <CardHeader className="bg-muted/30">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-lg text-foreground">
            <Calculator className="size-5" />
            Resultado da Precificação
          </div>
          {hasResults && (
            <Button
              size="sm"
              variant="outline"
              onClick={onCalculateClick}
              className="gap-2"
            >
              <RefreshCw className="size-4" />
              Recalcular
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {!hasResults ? (
          // Estado vazio - sempre mostrado quando não há resultados
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
              <Calculator className="size-8 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-foreground">
              Nenhum cálculo realizado ainda
            </h3>
            <p className="mb-6 max-w-md text-sm text-muted-foreground">
              Clique no botão abaixo para começar a calcular preços e margens para seus produtos
            </p>
            <Button onClick={onCalculateClick} className="gap-2">
              <Plus className="size-4" />
              Calcular Primeiro Preço
            </Button>
          </div>
        ) : (
          // Resultados do cálculo
          <div className="space-y-4">
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
                <div className="rounded-lg bg-muted/30 p-4">
                  <h4 className="mb-3 font-semibold text-orange-600 dark:text-orange-400">
                    Análise do Preço Praticado
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Preço Praticado:</div>
                    <div className="font-medium">{formatarMoeda(margemRealResult.preco_praticado || 0)}</div>
                    
                    <div className="font-semibold text-orange-600 dark:text-orange-400">Margem Real (Unitária):</div>
                    <div className="font-semibold text-orange-600 dark:text-orange-400">
                      {formatarMoeda(margemRealResult.margem_unitaria_real || 0)}
                    </div>
                    
                    <div className="font-semibold text-orange-600 dark:text-orange-400">Margem Real (%):</div>
                    <div className="font-semibold text-orange-600 dark:text-orange-400">
                      {formatarPercentual(margemRealResult.margem_percentual_real || 0)}
                    </div>
                  </div>
                  
                  {/* Indicador de performance da margem */}
                  {pricingResult.margem_percentual > 0 && margemRealResult.margem_percentual_real !== undefined && (
                    <div className="mt-3 pt-3 border-t border-border">
                      {margemRealResult.margem_percentual_real >= pricingResult.margem_percentual ? (
                        <div className="text-green-600 dark:text-green-400 font-medium flex items-center gap-2">
                          ✓ Margem real está acima da desejada
                        </div>
                      ) : (
                        <div className="text-red-600 dark:text-red-400 font-medium flex items-center gap-2">
                          ⚠ Margem real está abaixo da desejada
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};