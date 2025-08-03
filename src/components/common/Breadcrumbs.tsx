import { ChevronRight, Home } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  className?: string;
}

const routeLabels: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/strategy': 'Estratégia',
  '/marketplaces': 'Marketplaces',
  '/categories': 'Categorias',
  '/products': 'Produtos',
  '/shipping': 'Frete',
  '/commissions': 'Comissões',
  '/fixed-fees': 'Taxas Fixas',
  '/sales': 'Vendas',
  '/pricing': 'Precificação',
  '/subscription': 'Assinaturas',
  '/admin': 'Dashboard Admin',
};

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  const location = useLocation();
  
  // Se não há items fornecidos, gerar automaticamente baseado na rota
  const breadcrumbItems = items || (() => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const generatedItems: BreadcrumbItem[] = [{ label: 'Home', path: '/dashboard' }];
    
    let currentPath = '';
    pathSegments.forEach((segment) => {
      currentPath += `/${segment}`;
      const label = routeLabels[currentPath] || segment.charAt(0).toUpperCase() + segment.slice(1);
      generatedItems.push({
        label,
        path: currentPath
      });
    });
    
    return generatedItems;
  })();

  // Se só tem um item (Home), não mostrar breadcrumbs
  if (breadcrumbItems.length <= 1) {
    return null;
  }

  return (
    <nav className={cn("flex items-center space-x-1 text-sm text-muted-foreground", className)}>
      <Link 
        to="/dashboard" 
        className="flex items-center hover:text-foreground transition-colors"
      >
        <Home className="w-4 h-4" />
      </Link>
      
      {breadcrumbItems.slice(1).map((item, index) => {
        const isLast = index === breadcrumbItems.length - 2;
        
        return (
          <div key={item.path || item.label} className="flex items-center">
            <ChevronRight className="w-4 h-4 mx-1" />
            {isLast ? (
              <span className="font-medium text-foreground">{item.label}</span>
            ) : (
              <Link 
                to={item.path || '#'} 
                className="hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}