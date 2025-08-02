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
  Crown,
  Settings,
  Shield,
  ChevronLeft,
  ChevronRight,
  Zap
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
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
import { Button } from "@/components/ui/button";

const menuItems = [
  { id: "dashboard", title: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { id: "strategy", title: "Estratégia", icon: Target, path: "/strategy" },
  { id: "marketplaces", title: "Marketplaces", icon: Store, path: "/marketplaces" },
  { id: "categories", title: "Categorias", icon: FolderOpen, path: "/categories" },
  { id: "products", title: "Produtos", icon: Package, path: "/products" },
  { id: "shipping", title: "Frete", icon: Truck, path: "/shipping" },
  { id: "commissions", title: "Comissões", icon: Percent, path: "/commissions" },
  { id: "fixed-fees", title: "Taxas Fixas", icon: DollarSign, path: "/fixed-fees" },
  { id: "sales", title: "Vendas", icon: BarChart3, path: "/sales" },
  { id: "pricing", title: "Precificação", icon: Calculator, path: "/pricing" },
];

interface MenuItemProps {
  item: typeof menuItems[0];
  collapsed: boolean;
  isActive: boolean;
}

function MenuItem({ item, collapsed, isActive }: MenuItemProps) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        className={cn(
          "w-full justify-start gap-3 h-11 rounded-lg transition-all duration-200",
          isActive
            ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        )}
      >
        <Link to={item.path}>
          <item.icon className="w-5 h-5 shrink-0" />
          {!collapsed && <span className="font-medium">{item.title}</span>}
          {collapsed && <div className="sr-only">{item.title}</div>}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  const { profile } = useAuth();
  const location = useLocation();


  return (
    <Sidebar className="border-r-0 bg-sidebar">
      <SidebarHeader className="p-6 relative">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          {!collapsed && (
            <div className="flex-1">
              <h2 className="text-lg font-bold text-sidebar-foreground bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Peepers Hub
              </h2>
              <p className="text-xs text-sidebar-foreground/70">
                Price Pilot
              </p>
            </div>
          )}
        </div>
        
        {/* Botão de colapsar sutil */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className={cn(
            "absolute top-6 w-6 h-6 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent rounded-full transition-all duration-200",
            collapsed ? "right-2" : "right-4"
          )}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </Button>
      </SidebarHeader>

      <SidebarContent className="space-y-4">
        {/* Price Pilot Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70 text-xs uppercase tracking-wider">
            {!collapsed ? "Price Pilot" : ""}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <MenuItem
                  key={item.id}
                  item={item}
                  collapsed={collapsed}
                  isActive={location.pathname === item.path}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Account & Settings */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/70 text-xs uppercase tracking-wider">
            {!collapsed ? "Conta" : ""}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  className={cn(
                    "w-full justify-start gap-3 h-11 rounded-lg transition-all duration-200",
                    location.pathname === '/subscription'
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Link to="/subscription">
                    <Crown className="w-5 h-5 shrink-0" />
                    {!collapsed && <span className="font-medium">Assinaturas</span>}
                    {collapsed && <div className="sr-only">Assinaturas</div>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton
                  className={cn(
                    "w-full justify-start gap-3 h-11 rounded-lg transition-all duration-200",
                    "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Settings className="w-5 h-5 shrink-0" />
                  {!collapsed && <span className="font-medium">Configurações</span>}
                  {collapsed && <div className="sr-only">Configurações</div>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Section - Only for Super Admins */}
        {profile?.role === 'super_admin' && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground/70 text-xs uppercase tracking-wider">
              {!collapsed ? "Administração" : ""}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    className={cn(
                      "w-full justify-start gap-3 h-11 rounded-lg transition-all duration-200",
                      location.pathname === '/admin'
                        ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <Link to="/admin">
                      <Shield className="w-5 h-5 shrink-0" />
                      {!collapsed && <span className="font-medium">Dashboard Admin</span>}
                      {collapsed && <div className="sr-only">Dashboard Admin</div>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}