import { Search, Bell, User, LogOut, Settings, Zap, Command } from '@/components/ui/icons';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ThemeManager } from "@/components/ui/theme-manager";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

export function AppHeader() {
  const { user, profile, signOut } = useAuth();
  const [searchValue, setSearchValue] = useState("");

  const getUserInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'super_admin': return 'Super Admin';
      case 'admin': return 'Administrador';
      case 'user': return 'Usuário';
      default: return 'Usuário';
    }
  };

  return (
    <header role="banner" className="sticky top-0 z-50 h-14 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:h-16 md:h-20">
      <div className="flex h-full items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left section - Sidebar trigger, logo and search */}
        <div className="flex flex-1 items-center gap-2 sm:gap-4">
          <SidebarTrigger className="size-8 sm:size-9" />

          {/* Logo */}
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-primary shadow-card">
              <Zap className="size-5 text-white" />
            </div>
            <span className="hidden bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-base font-bold text-transparent sm:inline sm:text-lg md:text-xl">
              Catalog Maker Hub
            </span>
          </div>

          {/* Global Search with improved styling */}
          <div role="search" className="relative hidden max-w-lg flex-1 md:block">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Command className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar produtos, categorias, marketplaces... (Ctrl+K)"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="border-0 bg-muted/50 px-10 transition-all duration-200 focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-primary"
            />
          </div>

          {/* Mobile Search Trigger */}
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Abrir busca"
                tabIndex={0}
                className="md:hidden"
              >
                <Search className="size-5" />
              </Button>
            </DialogTrigger>
            <DialogContent
              className="p-4 sm:max-w-lg sm:p-6"
              role="search"
              tabIndex={-1}
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  autoFocus
                  placeholder="Buscar produtos, categorias, marketplaces..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  className="pl-10"
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Right section - Theme Manager, Notifications and user */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Theme Manager */}
          <ThemeManager />
          
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative" aria-label="Notificações" tabIndex={0}>
            <Bell className="size-5" />
            <Badge
              variant="destructive"
              className="absolute -right-1 -top-1 flex size-5 items-center justify-center p-0 text-xs"
            >
              3
            </Badge>
          </Button>

          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex h-auto items-center gap-2 p-sm sm:gap-3"
                aria-label="Menu do usuário"
                tabIndex={0}
              >
                <Avatar className="size-8">
                  <AvatarFallback className="bg-primary text-sm text-primary-foreground">
                    {getUserInitials(profile?.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden text-left sm:block">
                  <p className="text-sm font-medium text-foreground">
                    {profile?.full_name || 'Usuário'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {getRoleLabel(profile?.role)}
                  </p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-xs">
                  <p className="text-sm font-medium leading-none">
                    {profile?.full_name || 'Usuário'}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem>
                <User className="mr-2 size-4" />
                <span>Perfil</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem>
                <Settings className="mr-2 size-4" />
                <span>Configurações</span>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={signOut} className="text-destructive">
                <LogOut className="mr-2 size-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}