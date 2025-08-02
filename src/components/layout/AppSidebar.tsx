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
  GripVertical,
  ChevronLeft,
  ChevronRight,
  Zap
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import {
  CSS,
} from '@dnd-kit/utilities';

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

const defaultMenuItems = [
  { id: "dashboard", title: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { id: "estrategia", title: "Estratégia", icon: Target, path: "/estrategia" },
  { id: "marketplaces", title: "Marketplaces", icon: Store, path: "/marketplaces" },
  { id: "categorias", title: "Categorias", icon: FolderOpen, path: "/categorias" },
  { id: "produtos", title: "Produtos", icon: Package, path: "/produtos" },
  { id: "frete", title: "Frete", icon: Truck, path: "/frete" },
  { id: "comissoes", title: "Comissões", icon: Percent, path: "/comissoes" },
  { id: "taxas-fixas", title: "Taxas Fixas", icon: DollarSign, path: "/taxas-fixas" },
  { id: "vendas", title: "Vendas", icon: BarChart3, path: "/vendas" },
  { id: "precificacao", title: "Precificação", icon: Calculator, path: "/precificacao" },
];

interface SortableMenuItemProps {
  item: typeof defaultMenuItems[0];
  collapsed: boolean;
}

function SortableMenuItem({ item, collapsed }: SortableMenuItemProps) {
  const location = useLocation();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isActive = location.pathname === item.path || (location.pathname === '/' && item.path === '/dashboard');

  return (
    <SidebarMenuItem ref={setNodeRef} style={style}>
      <SidebarMenuButton
        asChild
        className={cn(
          "w-full justify-start gap-3 h-11 rounded-lg transition-all duration-200 group",
          isActive
            ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        )}
      >
        <Link to={item.path}>
          <item.icon className="w-5 h-5 shrink-0" />
          {!collapsed && (
            <>
              <span className="font-medium flex-1">{item.title}</span>
              <GripVertical 
                className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing" 
                {...attributes}
                {...listeners}
              />
            </>
          )}
          {collapsed && (
            <div className="sr-only">{item.title}</div>
          )}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

interface AppSidebarProps {}

export function AppSidebar({}: AppSidebarProps) {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  const [menuItems, setMenuItems] = useState(defaultMenuItems);
  const { profile } = useAuth();
  const location = useLocation();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setMenuItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

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
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={menuItems.map(item => item.id)} strategy={verticalListSortingStrategy}>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SortableMenuItem
                      key={item.id}
                      item={item}
                      collapsed={collapsed}
                    />
                  ))}
                </SidebarMenu>
              </SortableContext>
            </DndContext>
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