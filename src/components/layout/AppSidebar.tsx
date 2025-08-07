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
  Zap,
  Activity,
  ChevronDown,
  ChevronUp,
  Bot,
  Palette
} from '@/components/ui/icons';
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Heading, Text } from "@/components/ui/typography";

const mainMenuItems = [
  { id: "dashboard", title: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { id: "strategy", title: "Estratégia", icon: Target, path: "/strategy" },
];

const menuGroups = [
  {
    id: "settings",
    title: "Configurações",
    icon: Settings,
    items: [
      { id: "marketplaces", title: "Marketplaces", icon: Store, path: "/marketplaces" },
      { id: "categories", title: "Categorias", icon: FolderOpen, path: "/categories" },
      { id: "shipping", title: "Frete", icon: Truck, path: "/shipping" },
      { id: "commissions", title: "Comissões", icon: Percent, path: "/commissions" },
      { id: "fixed-fees", title: "Taxas Fixas", icon: DollarSign, path: "/fixed-fees" },
    ],
  },
  {
    id: "operations",
    title: "Operações",
    icon: Activity,
    items: [
      { id: "products", title: "Produtos", icon: Package, path: "/products" },
      { id: "sales", title: "Vendas", icon: BarChart3, path: "/sales" },
      { id: "pricing", title: "Precificação", icon: Calculator, path: "/pricing" },
      { id: "ad-generator", title: "Gerador de Anúncios", icon: Zap, path: "/ad-generator" },
    ],
  },
];

const accountMenuItems = [
  { id: "subscription", title: "Assinaturas", icon: Crown, path: "/subscription" },
];

const adminMenuItems = [
  { id: "admin-dashboard", title: "Dashboard Admin", icon: Shield, path: "/admin" },
  { id: "admin-ai", title: "Assistentes IA", icon: Bot, path: "/admin/assistentes-ia" },
  { id: "admin-theme", title: "Tema", icon: Palette, path: "/admin/theme" },
];

type MenuItemType = (typeof mainMenuItems)[0];

interface MenuItemProps {
  item: MenuItemType;
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
          <item.icon className="size-5 shrink-0" />
          {!collapsed && <span className="font-medium">{item.title}</span>}
          {collapsed && <div className="sr-only">{item.title}</div>}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

interface CollapsibleMenuGroupProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: MenuItemType[];
  collapsed: boolean;
  location: ReturnType<typeof useLocation>;
}

function CollapsibleMenuGroup({ title, icon: Icon, items, collapsed, location }: CollapsibleMenuGroupProps) {
  const [isOpen, setIsOpen] = useState(() => {
    const stored = localStorage.getItem(`sidebar-group-${title.toLowerCase()}`);
    return stored !== null ? JSON.parse(stored) : true;
  });

  const [userClosedManually, setUserClosedManually] = useState(false);

  const hasActiveItem = items.some(item => location.pathname.startsWith(item.path));

  // Auto-open only if user hasn't manually closed and there's an active item
  useEffect(() => {
    if (hasActiveItem && !isOpen && !userClosedManually) {
      setIsOpen(true);
    }
  }, [hasActiveItem, isOpen, userClosedManually]);

  // Reset manual close flag when changing groups (no active items)
  useEffect(() => {
    if (!hasActiveItem) {
      setUserClosedManually(false);
    }
  }, [hasActiveItem]);

  // Save state to localStorage
  useEffect(() => {
    localStorage.setItem(`sidebar-group-${title.toLowerCase()}`, JSON.stringify(isOpen));
  }, [isOpen, title]);

  // Handle manual toggle
  const handleToggle = (newOpen: boolean) => {
    setIsOpen(newOpen);
    if (!newOpen && hasActiveItem) {
      setUserClosedManually(true);
    }
  };

  return (
    <SidebarMenuItem>
      <Collapsible open={isOpen} onOpenChange={handleToggle}>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            className={cn(
              "h-11 w-full justify-start gap-3 rounded-lg transition-all duration-200",
              hasActiveItem
                ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <Icon className="size-5 shrink-0" />
            {!collapsed && (
              <>
                <span className="font-medium">{title}</span>
                {isOpen ? (
                  <ChevronUp className="ml-auto size-4" />
                ) : (
                  <ChevronDown className="ml-auto size-4" />
                )}
              </>
            )}
            {collapsed && <span className="sr-only">{title}</span>}
          </SidebarMenuButton>
        </CollapsibleTrigger>
        {!collapsed && (
          <CollapsibleContent>
            <SidebarMenuSub>
              {items.map((item) => (
                <SidebarMenuSubItem key={item.id}>
                  <SidebarMenuSubButton
                    asChild
                    className={cn(
                      location.pathname.startsWith(item.path)
                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <Link to={item.path}>
                      <item.icon className="size-4 shrink-0" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        )}
      </Collapsible>
    </SidebarMenuItem>
  );
}

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { profile } = useAuth();
  const location = useLocation();

  return (
    <Sidebar collapsible="icon" className="border-r-0 bg-sidebar">
      <SidebarHeader className="p-lg">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
            <Zap className="size-5 text-primary" />
          </div>
          {!collapsed && (
            <div className="flex-1">
              <Heading variant="h2">
                Peepers Hub
              </Heading>
              <Text variant="caption">
                Price Pilot
              </Text>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="space-y-md">
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-sidebar-foreground/70">
            {!collapsed ? "Principal" : ""}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenuItems.map((item) => (
                <MenuItem
                  key={item.id}
                  item={item}
                  collapsed={collapsed}
                  isActive={location.pathname.startsWith(item.path)}
                />
              ))}

              {menuGroups.map((group) => (
                <CollapsibleMenuGroup
                  key={group.id}
                  title={group.title}
                  icon={group.icon}
                  items={group.items}
                  collapsed={collapsed}
                  location={location}
                />
              ))}
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Account & Settings */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-sidebar-foreground/70">
            {!collapsed ? "Conta" : ""}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {accountMenuItems.map((item) => (
                <MenuItem
                  key={item.id}
                  item={item}
                  collapsed={collapsed}
                  isActive={location.pathname.startsWith(item.path)}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Section - Only for Super Admins */}
        {profile?.role === 'super_admin' && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs uppercase tracking-wider text-sidebar-foreground/70">
              {!collapsed ? "Administração" : ""}
            </SidebarGroupLabel>
            <SidebarGroupContent>
                <SidebarMenu>
                  {adminMenuItems.map((item) => (
                    <MenuItem
                      key={item.id}
                      item={item}
                      collapsed={collapsed}
                      isActive={location.pathname.startsWith(item.path)}
                    />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </SidebarContent>
    </Sidebar>
  );
}

