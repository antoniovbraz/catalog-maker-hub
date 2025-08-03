import { Search, Bell, User, LogOut, Settings, Zap, Command } from '@/components/ui/icons';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
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
    <header role="banner" className="h-14 sm:h-16 md:h-20 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="flex h-full items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left section - Sidebar trigger, logo and search */}
        <div className="flex items-center gap-2 sm:gap-4 flex-1">
          <SidebarTrigger className="h-8 w-8 sm:h-9 sm:w-9" />

          {/* Logo */}
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="flex items-center justify-center w-8 h-8 bg-gradient-primary rounded-lg shadow-card">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-base sm:text-lg md:text-xl bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent hidden sm:inline">
              Catalog Maker Hub
            </span>
          </div>

          {/* Global Search with improved styling */}
          <div role="search" className="relative max-w-lg flex-1 hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Command className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar produtos, categorias, marketplaces... (Ctrl+K)"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="pl-10 pr-10 bg-muted/50 border-0 focus-visible:ring-2 focus-visible:ring-primary focus-visible:bg-background transition-all duration-200"
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
                <Search className="w-5 h-5" />
              </Button>
            </DialogTrigger>
            <DialogContent
              className="sm:max-w-lg p-4 sm:p-6"
              role="search"
              tabIndex={-1}
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
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

        {/* Right section - Notifications and user */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative" aria-label="Notificações" tabIndex={0}>
            <Bell className="w-5 h-5" />
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0"
            >
              3
            </Badge>
          </Button>

          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 sm:gap-3 h-auto p-sm"
                aria-label="Menu do usuário"
                tabIndex={0}
              >
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {getUserInitials(profile?.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:block text-left">
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
                <User className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Configurações</span>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={signOut} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}