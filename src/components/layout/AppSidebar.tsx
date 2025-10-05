import { Building2, Calendar, FileText, Home, Map, Route, Users, LogOut, Moon, Sun, Settings, BarChart3, UserCircle, Layout } from 'lucide-react';
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
  { title: 'Respostas de Formulários', url: '/respostas-formularios', icon: FileText, permission: 'manage_settings' },
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
    <Sidebar className={collapsed ? 'w-16' : 'w-56'} collapsible="icon">
      <SidebarHeader className="p-4 pb-3">
        {!collapsed ? (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold leading-tight">Gabinete Fácil</span>
              {currentGabinete && (
                <span className="text-xs text-muted-foreground leading-tight">
                  {currentGabinete.gabinetes.nome}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-xs text-muted-foreground px-2 mb-1">
              Menu
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {visibleMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-md px-2 py-1.5 transition-all duration-200 ${
                          isActive
                            ? 'text-primary font-medium bg-primary/5'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                        }`
                      }
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {!collapsed && <span className="text-sm">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className={`mt-auto ${collapsed ? 'p-2' : 'p-3'}`}>
        {!collapsed && gabinetes.length > 1 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="mb-2 w-full justify-start h-auto py-1.5 px-2 text-left hover:bg-muted/50 font-normal"
              >
                <span className="text-xs text-muted-foreground truncate">{currentGabinete?.gabinetes.nome}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel className="text-xs">Trocar Gabinete</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {gabinetes.map((gab) => (
                <DropdownMenuItem
                  key={gab.gabinete_id}
                  onClick={() => setCurrentGabinete(gab)}
                  className="text-xs"
                >
                  <div className="flex flex-col">
                    <span>{gab.gabinetes.nome}</span>
                    <span className="text-[10px] text-muted-foreground">
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

        <div className={`flex ${collapsed ? 'flex-col gap-1 items-center' : 'gap-1'}`}>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className={`${!collapsed ? 'flex-1 h-8' : 'w-8 h-8'} hover:bg-muted/50`}
            title={theme === 'light' ? 'Modo escuro' : 'Modo claro'}
          >
            {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={signOut}
            className={`${!collapsed ? 'flex-1 h-8' : 'w-8 h-8'} hover:bg-muted/50`}
            title="Sair"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
