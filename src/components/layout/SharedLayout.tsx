import { ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { PageTransition } from "@/components/common/PageTransition";

interface SharedLayoutProps {
  children: ReactNode;
}

export function SharedLayout({ children }: SharedLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        
        <div className="flex flex-1 flex-col overflow-hidden">
          <AppHeader />
          
          {/* Main Content with improved container and transitions */}
          <main className="flex-1 overflow-auto bg-gradient-subtle">
            <div className="container mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
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