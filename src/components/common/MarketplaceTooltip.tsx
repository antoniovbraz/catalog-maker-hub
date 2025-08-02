import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface MarketplaceTooltipProps {
  marketplaceName: string;
  metadata?: Record<string, any>;
}

export const MarketplaceTooltip = ({ marketplaceName, metadata }: MarketplaceTooltipProps) => {
  const getTooltipContent = () => {
    if (!metadata) return null;

    const tooltips: Record<string, string> = {
      'Mercado Livre Clássico': 'Anúncios tradicionais com comissão entre 10-14% e regras de taxa fixa variáveis por faixa de preço.',
      'Mercado Livre Premium': 'Anúncios premium com maior visibilidade, comissão entre 15-19% e parcelamento em até 12x sem juros.',
      'Mercado Livre Livros': 'Modalidade específica para livros com regras diferenciadas de taxa fixa (menores que outras categorias).',
      'Shopee Normal': 'Modalidade padrão do Shopee com comissão limitada a R$ 100,00 por venda.',
      'Shopee Frete Grátis': 'Modalidade com frete grátis, comissão limitada a R$ 100,00 e taxa fixa ligeiramente maior.',
      'Amazon': 'Marketplace global com comissão de 15% e taxa fixa de R$ 4,00.',
      'Magalu': 'Marketplace nacional com comissão de 14% e taxa fixa de R$ 3,50.'
    };

    return tooltips[marketplaceName];
  };

  const content = getTooltipContent();
  
  if (!content) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="h-4 w-4 text-muted-foreground cursor-help" />
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p>{content}</p>
          {metadata && (
            <div className="mt-2 text-xs">
              {metadata.commission_range && (
                <div>Comissão: {metadata.commission_range}</div>
              )}
              {metadata.installments && (
                <div>Parcelamento: {metadata.installments}</div>
              )}
              {metadata.commission_cap && (
                <div>Limite comissão: R$ {metadata.commission_cap}</div>
              )}
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};