import { ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { AppBreadcrumbs } from "@/components/common/AppBreadcrumbs";

interface SharedLayoutProps {
  children: ReactNode;
}

export function SharedLayout({ children }: SharedLayoutProps) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <AppHeader />
          
          {/* Breadcrumbs Section */}
          <div className="border-b border-border bg-muted/30 px-6 py-3">
            <AppBreadcrumbs />
          </div>
          
          {/* Main Content with improved container */}
          <main className="flex-1 overflow-auto">
            <div className="container max-w-7xl mx-auto p-6 space-y-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}