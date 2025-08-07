import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, DollarSign, Target, TrendingUp, TrendingDown, GripVertical } from "@/components/ui/icons";
import { Sparkline } from "@/components/ui/sparkline";
import { EnhancedTooltip } from "@/components/common/EnhancedTooltip";
import { colors } from "@/styles/tokens";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { PricingResult } from "./types";

interface PricingCardProps {
  result: PricingResult;
  index: number;
}

export const PricingCard: React.FC<PricingCardProps> = ({ result, index }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: result.marketplace_id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? "grabbing" : "grab",
  } as React.CSSProperties;

  const sparklineData = Array.from({ length: 7 }, () => Math.random() * 10 + result.margem_percentual);

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`
        group relative bg-gradient-to-br from-card to-card/50
        transition-all duration-300 ease-in-out
        hover:scale-[1.02] hover:border-primary/30
        hover:bg-gradient-to-br hover:from-card hover:to-primary/5 hover:shadow-elegant
        ${isDragging ? "z-50 rotate-1 scale-105 shadow-elegant" : ""}
      `}
      {...attributes}
    >
      {index === 0 && (
        <Badge className="absolute -right-2 -top-2 bg-success text-success-foreground animate-in zoom-in-95">
          🏆 Melhor
        </Badge>
      )}
      <div {...listeners} className="absolute right-2 top-2 touch-none opacity-0 transition-all duration-200 group-hover:opacity-100">
        <GripVertical className="size-4 cursor-grab text-muted-foreground transition-colors hover:text-primary active:cursor-grabbing" />
      </div>

      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="truncate">{result.marketplace_name}</span>
            <EnhancedTooltip
              title="Performance da Margem"
              details={[
                { label: "Margem Atual", value: result.margem_percentual, format: "percentage" },
                { label: "Meta de Margem", value: result.margem_desejada, format: "percentage" },
                { label: "Preço Sugerido", value: result.preco_sugerido, format: "currency" },
                { label: "Margem Unitária", value: result.margem_unitaria, format: "currency" },
              ]}
            >
              <div className="flex items-center gap-1">
                <Badge variant={result.margem_percentual >= 15 ? "default" : "secondary"}>
                  {result.margem_percentual.toFixed(1)}%
                </Badge>
                {result.margem_percentual >= result.margem_desejada ? (
                  <TrendingUp className="size-3 text-success" />
                ) : (
                  <TrendingDown className="size-3 text-warning" />
                )}
              </div>
            </EnhancedTooltip>
          </div>
          <Sparkline
            data={sparklineData}
            stroke={result.margem_percentual >= 15 ? colors.success.DEFAULT : colors.warning.DEFAULT}
            size="sm"
          />
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="space-y-xs">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Package className="size-3" />
              <span>Custo Total</span>
            </div>
            <div className="font-medium">R$ {result.custo_total.toFixed(2)}</div>
          </div>

          <div className="space-y-xs">
            <div className="flex items-center gap-1 text-muted-foreground">
              <DollarSign className="size-3" />
              <span>Preço Praticado</span>
            </div>
            <div className="text-lg font-bold">R$ {result.preco_praticado.toFixed(2)}</div>
          </div>

          <div className="space-y-xs">
            <div className="flex items-center gap-1 text-muted-foreground">
              <TrendingUp className="size-3" />
              <span>Margem R$</span>
            </div>
            <div className="font-semibold text-success">R$ {result.margem_unitaria.toFixed(2)}</div>
          </div>

          <div className="space-y-xs">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Target className="size-3" />
              <span>Comissão</span>
            </div>
            <div className="font-medium">{result.comissao.toFixed(2)}%</div>
          </div>
        </div>

        <div className="border-t border-border/50 pt-3">
          <div className="mb-2 text-xs font-medium text-foreground">
            Para atingir {result.margem_desejada.toFixed(1)}% de margem:
          </div>
          <div className="rounded-lg border border-primary/20 bg-gradient-to-r from-primary/10 to-primary/5 p-3">
            <div className="flex items-center justify-between">
              <span className="font-medium text-primary">Preço Sugerido:</span>
              <span className="font-bold text-primary">R$ {result.preco_sugerido.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="space-y-xs border-t border-border/30 pt-2 text-xs text-muted-foreground">
          <div className="mb-2 font-medium text-foreground">Detalhamento:</div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1">
            <div>Valor Fixo: R$ {result.valor_fixo.toFixed(2)}</div>
            <div>Frete: R$ {result.frete.toFixed(2)}</div>
            <div>Taxa Cartão: {result.taxa_cartao.toFixed(1)}%</div>
            <div>Prov. Desc.: {result.provisao_desconto.toFixed(1)}%</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
