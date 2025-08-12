import { Fragment } from "react";
import { Home } from '@/components/ui/icons';
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface BreadcrumbEntry {
  label: string;
  path?: string;
}

interface AppBreadcrumbsProps {
  items?: BreadcrumbEntry[];
  className?: string;
}

const routeLabels: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/strategy": "Estratégia",
  "/marketplaces": "Marketplaces",
  "/categories": "Categorias",
  "/products": "Produtos",
  "/shipping": "Frete",
  "/commissions": "Comissões",
  "/fixed-fees": "Taxas Fixas",
  "/sales": "Vendas",
  "/pricing": "Precificação",
  "/subscription": "Assinaturas",
  "/admin": "Dashboard Admin",
};

export function AppBreadcrumbs({ items, className }: AppBreadcrumbsProps) {
  const location = useLocation();

  // Generate items automatically when none are provided
  const breadcrumbItems =
    items ||
    (() => {
      const pathSegments = location.pathname.split("/").filter(Boolean);
      const generated: BreadcrumbEntry[] = [
        { label: "Home", path: "/dashboard" },
      ];

      let currentPath = "";
      pathSegments.forEach((segment) => {
        currentPath += `/${segment}`;
        const label =
          routeLabels[currentPath] ||
          segment.charAt(0).toUpperCase() + segment.slice(1);
        generated.push({ label, path: currentPath });
      });

      return generated;
    })();

  // Hide when only home is present
  if (breadcrumbItems.length <= 1) {
    return null;
  }

  return (
    <Breadcrumb className={cn(className)}>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/dashboard" className="inline-flex items-center gap-1">
              <Home className="size-4" />
              <span className="sr-only">Dashboard</span>
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {breadcrumbItems.slice(1).map((item, index) => {
          const isLast = index === breadcrumbItems.length - 2;
          return (
            <Fragment key={item.path || item.label}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={item.path || "#"}>{item.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export default AppBreadcrumbs;
