import { ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { AppBreadcrumbs } from "@/components/common/AppBreadcrumbs";
import { PageTransition } from "@/components/common/PageTransition";

interface SharedLayoutProps {
  children: ReactNode;
}

export function SharedLayout({ children }: SharedLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <AppHeader />
          
          {/* Main Content with improved container and transitions */}
          <main className="flex-1 overflow-auto bg-gradient-subtle">
            <div className="container max-w-7xl mx-auto p-6 space-y-6">
              <PageTransition>
                {children}
              </PageTransition>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}