import { ReactNode } from "react";
import { ChevronRight, Home } from '@/components/ui/icons';
import { Link } from "react-router-dom";
import { Heading, Text } from "@/components/ui/typography";
import { colors, spacing, typography } from "@/styles/design-system";
import { cn } from "@/lib/utils";

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
    <header className={cn("border-b border-border", colors.card)}>
      <div className={cn("container mx-auto", spacing.px.md, spacing.py.lg)}>
        {/* Breadcrumbs */}
        {breadcrumbs.length > 0 && (
          <nav className={cn(spacing.mb.md, "flex items-center", spacing.spaceX.xs, typography.body, colors.muted)}>
            <Link to="/dashboard" className="transition-colors hover:text-foreground">
              <Home className="size-4" />
            </Link>
            {breadcrumbs.map((crumb, index) => (
            <div key={index} className={cn("flex items-center", spacing.spaceX.xs)}>
                <ChevronRight className="size-4" />
                {crumb.href ? (
                  <Link 
                    to={crumb.href} 
                    className="transition-colors hover:text-foreground"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className={cn("font-medium", colors.foreground)}>{crumb.label}</span>
                )}
              </div>
            ))}
          </nav>
        )}

        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className={cn(spacing.mb.sm, "flex items-center", spacing.gap.sm)}>
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
            <div className={cn("flex items-center", spacing.gap.sm)}>
              {actions}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}