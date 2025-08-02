import { ReactNode, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { LayoutProvider } from "@/contexts/LayoutContext";

interface SharedLayoutProps {
  children: ReactNode;
}

export function SharedLayout({ children }: SharedLayoutProps) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const location = useLocation();

  // Set active tab based on current route
  useEffect(() => {
    if (location.pathname === '/admin') {
      setActiveTab('admin');
    } else if (location.pathname === '/subscription') {
      setActiveTab('subscription');
    } else {
      setActiveTab('dashboard');
    }
  }, [location.pathname]);

  return (
    <LayoutProvider>
      <SidebarProvider defaultOpen={true}>
        <div className="min-h-screen flex w-full bg-background">
          <AppSidebar activeTab={activeTab} onTabChange={setActiveTab} />
          
          <div className="flex-1 flex flex-col overflow-hidden">
            <AppHeader />
            
            <main className="flex-1 overflow-auto">
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </LayoutProvider>
  );
}