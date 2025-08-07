import { ReactNode } from "react";
import { ConfigurationHeader } from "./ConfigurationHeader";
import { PageTransition } from "@/components/common/PageTransition";
import { spacing } from "@/styles/design-system";
import { cn } from "@/lib/utils";

interface ConfigurationPageLayoutProps {
  title: string;
  description: string;
  icon?: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

export function ConfigurationPageLayout({
  title,
  description,
  icon,
  children,
  actions,
  breadcrumbs
}: ConfigurationPageLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      <ConfigurationHeader
        title={title}
        description={description}
        icon={icon}
        actions={actions}
        breadcrumbs={breadcrumbs}
      />

      <main className={cn("container mx-auto", spacing.px.md, spacing.py.lg, `sm:${spacing.px.lg}`)}>
        <PageTransition>
          <div className={cn("grid grid-cols-1", spacing.gap.lg, "lg:grid-cols-12 xl:grid-cols-12")}
          >
            {children}
          </div>
        </PageTransition>
      </main>
    </div>
  );
}