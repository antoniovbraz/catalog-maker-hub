import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tag, Info } from "@/components/ui/icons";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatarMoeda } from "@/utils/pricing";
import type { ProductWithCategory } from "@/types/products";

interface ProductPriceInfo {
  price: number;
  source: 'ml' | 'product';
}

interface CostsCardProps {
  product: ProductWithCategory;
  priceInfo?: ProductPriceInfo | null;
}

export function CostsCard({ product, priceInfo }: CostsCardProps): React.ReactElement {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="size-5" />
          Custos e Impostos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <div className="flex items-center gap-1">
              <label className="text-sm font-medium text-muted-foreground">Preço de venda</label>
              {priceInfo?.source === "ml" && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="size-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>Preço do Mercado Livre</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <p className="text-lg font-semibold">{formatarMoeda(priceInfo?.price || 0)}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Custo Unitário</label>
            <p className="text-lg font-semibold">{formatarMoeda(product.cost_unit)}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Custo Embalagem</label>
            <p className="text-lg font-semibold">{formatarMoeda(product.packaging_cost || 0)}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Taxa de Imposto</label>
            <p className="text-lg font-semibold">{product.tax_rate || 0}%</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}