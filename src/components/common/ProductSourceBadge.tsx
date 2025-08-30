import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Store, Package } from "lucide-react";

interface ProductSourceBadgeProps {
  source: 'manual' | 'mercado_livre' | 'shopee';
  className?: string;
}

export function ProductSourceBadge({ source, className }: ProductSourceBadgeProps) {
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

  const config = sourceConfig[source];
  const Icon = config.icon;

  return (
    <Badge 
      variant={config.variant}
      className={`${config.className} ${className}`}
    >
      <Icon className="w-3 h-3 mr-1" />
      {config.label}
    </Badge>
  );
}