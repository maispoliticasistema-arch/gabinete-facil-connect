import { Building2, Calendar, FileText, Home, Map, Route, Users, ChevronDown, LogOut, Moon, Sun, Settings, BarChart3, UserCircle, Layout } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useGabinete } from '@/contexts/GabineteContext';
import { usePermissions } from '@/hooks/usePermissions';
import { Button } from '@/components/ui/button';
import { useState, useEffect, useMemo } from 'react';

type Permission = 
  | 'view_eleitores'
  | 'view_demandas'
  | 'view_agenda'
  | 'view_roteiros'
  | 'view_mapa'
  | 'view_relatorios'
  | 'manage_settings';

interface MenuItem {
  title: string;
  url: string;
  icon: any;
  permission?: Permission;
}

const menuItems: MenuItem[] = [
  { title: 'Dashboard', url: '/', icon: Home },
  { title: 'Demandas', url: '/demandas', icon: FileText, permission: 'view_demandas' },
  { title: 'Eleitores', url: '/eleitores', icon: Users, permission: 'view_eleitores' },
  { title: 'Agenda', url: '/agenda', icon: Calendar, permission: 'view_agenda' },
  { title: 'Mapa', url: '/mapa', icon: Map, permission: 'view_mapa' },
  { title: 'Roteiros', url: '/roteiros', icon: Route, permission: 'view_roteiros' },
  { title: 'Relatórios', url: '/relatorios', icon: BarChart3, permission: 'view_relatorios' },
  { title: 'Construtor de Sites', url: '/construtor-de-sites', icon: Layout, permission: 'manage_settings' },
  { title: 'Minha Conta', url: '/minha-conta', icon: UserCircle },
  { title: 'Configurações', url: '/configuracoes', icon: Settings, permission: 'manage_settings' },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const collapsed = state === 'collapsed';
  const { signOut } = useAuth();
  const { gabinetes, currentGabinete, setCurrentGabinete } = useGabinete();
  const { hasPermission, loading } = usePermissions();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Filtrar itens do menu baseado nas permissões
  const visibleMenuItems = useMemo(() => {
    if (loading) return [];
    
    return menuItems.filter(item => {
      // Dashboard sempre visível
      if (!item.permission) return true;
      // Verificar permissão
      return hasPermission(item.permission);
    });
  }, [hasPermission, loading]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar className={collapsed ? 'w-14' : 'w-64'} collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border p-4">
        {!collapsed && (
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Gabinete Fácil</h1>
              {currentGabinete?.gabinetes?.nome && (
                <p className="text-xs text-muted-foreground">
                  {currentGabinete.gabinetes.nome}
                </p>
              )}
            </div>
          </div>
        )}
        {collapsed && (
          <div className="flex justify-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary">
              <Building2 className="h-5 w-5 text-white" />
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
                          isActive
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                            : 'hover:bg-sidebar-accent/50'
                        }`
                      }
                    >
                      <item.icon className="h-5 w-5" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className={`border-t border-sidebar-border ${collapsed ? 'p-2' : 'p-4'}`}>
        {!collapsed && gabinetes.length > 1 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="mb-2 w-full justify-between bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent/80"
              >
                <span className="truncate">{currentGabinete?.gabinetes?.nome || 'Selecione um gabinete'}</span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Trocar Gabinete</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {gabinetes.map((gab) => (
                <DropdownMenuItem
                  key={gab.gabinete_id}
                  onClick={() => setCurrentGabinete(gab)}
                >
                  <div className="flex flex-col">
                    <span>{gab.gabinetes?.nome || 'Sem nome'}</span>
                    <span className="text-xs text-muted-foreground">
                      {gab.role === 'owner' && 'Proprietário'}
                      {gab.role === 'admin' && 'Administrador'}
                      {gab.role === 'assessor' && 'Assessor'}
                    </span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <div className={`flex ${collapsed ? 'flex-col gap-1 items-center' : 'gap-2'}`}>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className={`${!collapsed ? 'flex-1' : 'w-10 h-10'} bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent/80`}
          >
            {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={signOut}
            className={`${!collapsed ? 'flex-1' : 'w-10 h-10'} bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent/80`}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
