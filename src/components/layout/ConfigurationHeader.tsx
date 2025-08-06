import { ReactNode } from "react";
import { ChevronRight, Home } from '@/components/ui/icons';
import { Link } from "react-router-dom";
import { Heading, Text } from "@/components/ui/typography";

interface Breadcrumb {
  label: string;
  href?: string;
}

interface ConfigurationHeaderProps {
  title: string;
  description: string;
  icon?: ReactNode;
  actions?: ReactNode;
  breadcrumbs?: Breadcrumb[];
}

export function ConfigurationHeader({
  title,
  description,
  icon,
  actions,
  breadcrumbs = []
}: ConfigurationHeaderProps) {

  return (
    <header className="border-b border-border bg-card">
      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumbs */}
        {breadcrumbs.length > 0 && (
          <nav className="mb-4 flex items-center space-x-1 text-sm text-muted-foreground">
            <Link to="/dashboard" className="transition-colors hover:text-foreground">
              <Home className="size-4" />
            </Link>
            {breadcrumbs.map((crumb, index) => (
              <div key={index} className="flex items-center space-x-1">
                <ChevronRight className="size-4" />
                {crumb.href ? (
                  <Link 
                    to={crumb.href} 
                    className="transition-colors hover:text-foreground"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="font-medium text-foreground">{crumb.label}</span>
                )}
              </div>
            ))}
          </nav>
        )}

        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-3">
              {icon && (
                <div className="rounded-lg bg-primary/10 p-sm text-primary">
                  {icon}
                </div>
              )}
              <div>
                <Heading variant="h1" className="tracking-tight">
                  {title}
                </Heading>
              </div>
            </div>
            <Text variant="muted" className="max-w-3xl">
              {description}
            </Text>
          </div>

          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}