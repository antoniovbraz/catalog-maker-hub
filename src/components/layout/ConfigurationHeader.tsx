import { ReactNode } from "react";
import { ChevronRight, Home } from '@/components/ui/icons';
import { Link } from "react-router-dom";

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
    <header className="bg-card border-b border-border shadow-card">
      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumbs */}
        {breadcrumbs.length > 0 && (
          <nav className="flex items-center space-x-1 text-sm text-muted-foreground mb-4">
            <Link to="/dashboard" className="hover:text-foreground transition-colors">
              <Home className="h-4 w-4" />
            </Link>
            {breadcrumbs.map((crumb, index) => (
              <div key={index} className="flex items-center space-x-1">
                <ChevronRight className="h-4 w-4" />
                {crumb.href ? (
                  <Link 
                    to={crumb.href} 
                    className="hover:text-foreground transition-colors"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-foreground font-medium">{crumb.label}</span>
                )}
              </div>
            ))}
          </nav>
        )}

        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              {icon && (
                <div className="p-sm bg-primary/10 rounded-lg text-primary">
                  {icon}
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                  {title}
                </h1>
              </div>
            </div>
            
            <p className="text-lg text-muted-foreground max-w-3xl">
              {description}
            </p>
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