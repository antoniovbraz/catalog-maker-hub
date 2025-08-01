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
  GripVertical
} from "lucide-react";
import { useState } from "react";
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

const defaultMenuItems = [
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

interface SortableMenuItemProps {
  item: typeof defaultMenuItems[0];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  collapsed: boolean;
}

function SortableMenuItem({ item, activeTab, onTabChange, collapsed }: SortableMenuItemProps) {
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

  return (
    <SidebarMenuItem ref={setNodeRef} style={style}>
      <SidebarMenuButton
        onClick={() => onTabChange(item.id)}
        className={cn(
          "w-full justify-start gap-3 h-11 rounded-lg transition-all duration-200 group",
          activeTab === item.id
            ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        )}
      >
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
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

interface AppSidebarProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function AppSidebar({ activeTab, onTabChange }: AppSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const [menuItems, setMenuItems] = useState(defaultMenuItems);

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
                      activeTab={activeTab}
                      onTabChange={onTabChange}
                      collapsed={collapsed}
                    />
                  ))}
                </SidebarMenu>
              </SortableContext>
            </DndContext>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}