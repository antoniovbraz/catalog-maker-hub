import { 
  LayoutDashboard, 
  Target, 
  Store, 
  FolderOpen, 
  Package, 
  Truck, 
  Percent, 
  DollarSign, 
  BarChart3, 
  Calculator,
  ChevronRight,
  ChevronDown
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

const menuItems = [
  { id: "dashboard", title: "Dashboard", icon: LayoutDashboard },
  { id: "estrategia", title: "Estratégia", icon: Target },
  { id: "marketplaces", title: "Marketplaces", icon: Store },
  { id: "categorias", title: "Categorias", icon: FolderOpen },
  { id: "produtos", title: "Produtos", icon: Package },
  { id: "frete", title: "Frete", icon: Truck },
  { id: "comissoes", title: "Comissões", icon: Percent },
  { id: "taxas-fixas", title: "Taxas Fixas", icon: DollarSign },
  { id: "vendas", title: "Vendas", icon: BarChart3 },
  { id: "precificacao", title: "Precificação", icon: Calculator },
];

interface AppSidebarProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function AppSidebar({ activeTab, onTabChange }: AppSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar className="border-r-0 bg-sidebar">
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
            <Calculator className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div>
              <h2 className="text-lg font-bold text-sidebar-foreground">
                Catalog Maker
              </h2>
              <p className="text-xs text-sidebar-foreground/70">
                Hub de Precificação
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70 text-xs uppercase tracking-wider">
            {!collapsed ? "Navegação" : ""}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => onTabChange(item.id)}
                    className={cn(
                      "w-full justify-start gap-3 h-11 rounded-lg transition-all duration-200",
                      activeTab === item.id
                        ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <item.icon className="w-5 h-5 shrink-0" />
                    {!collapsed && (
                      <span className="font-medium">{item.title}</span>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}