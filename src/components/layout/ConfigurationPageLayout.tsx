import { ReactNode } from "react";
import { ConfigurationHeader } from "./ConfigurationHeader";
import { PageTransition } from "@/components/common/PageTransition";

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
      
      <main className="container max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <PageTransition>
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            {children}
          </div>
        </PageTransition>
      </main>
    </div>
  );
}