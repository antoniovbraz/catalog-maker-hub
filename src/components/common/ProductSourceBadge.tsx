import React from "react";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Store, Package, ExternalLink, CheckCircle2, AlertCircle } from "lucide-react";

interface ProductSourceBadgeProps {
  source: 'manual' | 'mercado_livre' | 'shopee';
  mlStatus?: 'not_synced' | 'syncing' | 'synced' | 'error' | 'pending';
  mlItemId?: string;
  className?: string;
}

export function ProductSourceBadge({ source, mlStatus, mlItemId, className }: ProductSourceBadgeProps) {
  const sourceConfig = {
    manual: {
      label: 'Manual',
      variant: 'default' as const,
      icon: Package,
      className: 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20'
    },
    mercado_livre: {
      label: 'Mercado Livre',
      variant: 'secondary' as const,
      icon: Store,
      className: 'bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20'
    },
    shopee: {
      label: 'Shopee',
      variant: 'outline' as const,
      icon: ShoppingCart,
      className: 'bg-orange-500/10 text-orange-600 hover:bg-orange-500/20'
    }
  };

  const statusConfig = {
    not_synced: { icon: Package, color: 'text-muted-foreground' },
    syncing: { icon: Package, color: 'text-blue-500' },
    synced: { icon: CheckCircle2, color: 'text-green-500' },
    error: { icon: AlertCircle, color: 'text-red-500' },
    pending: { icon: Package, color: 'text-amber-500' },
  };

  const config = sourceConfig[source];
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-2">
      <Badge 
        variant={config.variant}
        className={`${config.className} ${className}`}
      >
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
      
      {/* Status de vinculação para produtos manuais */}
      {source === 'manual' && mlStatus && (
        <div className="flex items-center gap-1">
          {mlStatus === 'synced' && mlItemId && (
            <a
              href={`https://www.mercadolivre.com.br/MLB-${mlItemId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-500 hover:text-green-600"
              title="Ver no Mercado Livre"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
           {mlStatus !== 'synced' && (
            <div 
              className={statusConfig[mlStatus]?.color || 'text-muted-foreground'}
              title={`Status: ${mlStatus}`}
            >
              {statusConfig[mlStatus]?.icon && React.createElement(statusConfig[mlStatus].icon, { className: "w-3 h-3" })}
            </div>
          )}
        </div>
      )}

      {/* Link direto para produtos importados do ML */}
      {source === 'mercado_livre' && mlItemId && (
        <a
          href={`https://www.mercadolivre.com.br/MLB-${mlItemId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-yellow-600 hover:text-yellow-700"
          title="Ver no Mercado Livre"
        >
          <ExternalLink className="w-3 h-3" />
        </a>
      )}
    </div>
  );
}