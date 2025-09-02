import { memo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { TableRow, TableCell } from "@/components/ui/table";
import { ExternalLink, RefreshCw, Loader2 } from "@/components/ui/icons";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { MLSyncProduct } from "@/services/ml-service";

interface MLProductRowProps {
  product: MLSyncProduct;
  isSelected: boolean;
  onSelect: (productId: string, checked: boolean) => void;
  onSync: (productId: string) => void;
  isProcessing: boolean;
  isLoading: boolean;
  writeEnabled: boolean;
}

function MLProductRowComponent({
  product,
  isSelected,
  onSelect,
  onSync,
  isProcessing,
  isLoading,
  writeEnabled,
}: MLProductRowProps) {
  const handleSelectChange = useCallback(
    (checked: boolean) => {
      onSelect(product.id, checked);
    },
    [onSelect, product.id]
  );

  const handleSyncClick = useCallback(() => {
    onSync(product.id);
  }, [onSync, product.id]);

  const getStatusBadge = useCallback((status: string) => {
    switch (status) {
      case "synced":
        return <Badge className="bg-success text-success-foreground">Sincronizado</Badge>;
      case "syncing":
        return <Badge variant="secondary">Sincronizando</Badge>;
      case "error":
        return <Badge variant="destructive">Erro</Badge>;
      default:
        return <Badge variant="outline">Não Sincronizado</Badge>;
    }
  }, []);

  return (
    <TableRow>
      <TableCell>
        <Checkbox checked={isSelected} onCheckedChange={handleSelectChange} />
      </TableCell>
      <TableCell className="font-medium">{product.name}</TableCell>
      <TableCell>{getStatusBadge(product.sync_status)}</TableCell>
      <TableCell>
        {product.ml_item_id ? (
          <div className="flex items-center space-x-1">
            <span className="font-mono text-sm">{product.ml_item_id}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                window.open(
                  `https://www.mercadolivre.com.br/p/${product.ml_item_id}`,
                  "_blank"
                )
              }
            >
              <ExternalLink className="size-3" />
            </Button>
          </div>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell>
        {product.last_sync_at ? (
          <span className="text-sm text-muted-foreground">
            {formatDistanceToNow(new Date(product.last_sync_at), {
              addSuffix: true,
              locale: ptBR,
            })}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell>
        <div className="flex gap-2">
          {writeEnabled && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSyncClick}
                    disabled={isProcessing}
                    aria-label="Enviar ao Mercado Livre"
                  >
                    {isLoading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <RefreshCw className="size-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Enviar ao Mercado Livre</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

export const MLProductRow = memo(MLProductRowComponent);

export default MLProductRow;

