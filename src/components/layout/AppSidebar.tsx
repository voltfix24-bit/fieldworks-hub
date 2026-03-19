import {
  LayoutDashboard,
  FolderKanban,
  Users,
  HardHat,
  Wrench,
  FileText,
  Settings,
  LogOut,
  Building2,
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';
import { Separator } from '@/components/ui/separator';

const mainNav = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Projecten', url: '/projects', icon: FolderKanban },
  { title: 'Klanten', url: '/clients', icon: Users },
  { title: 'Monteurs', url: '/technicians', icon: HardHat },
  { title: 'Apparatuur', url: '/equipment', icon: Wrench },
  { title: 'Rapporten', url: '/reports', icon: FileText },
];

const settingsNav = [
  { title: 'Instellingen', url: '/settings', icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const { tenant, branding } = useTenant();
  const { signOut } = useAuth();

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        {/* Brand header */}
        <div className="p-4 flex items-center gap-3">
          {branding?.logo_url ? (
            <img
              src={branding.logo_url}
              alt={tenant?.company_name || 'Logo'}
              className="h-8 w-8 rounded-md object-contain shrink-0"
            />
          ) : (
            <div className="h-8 w-8 rounded-md tenant-primary-bg flex items-center justify-center shrink-0">
              <Building2 className="h-4 w-4 text-sidebar-primary-foreground" />
            </div>
          )}
          {!collapsed && (
            <span className="text-sm font-semibold text-sidebar-foreground truncate">
              {tenant?.company_name || 'Uw Bedrijf'}
            </span>
          )}
        </div>

        <Separator className="bg-sidebar-border" />

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50 text-xs uppercase tracking-wider">
            Hoofdmenu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === '/dashboard'}
                      className="hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50 text-xs uppercase tracking-wider">
            Beheer
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={signOut}
              className="hover:bg-sidebar-accent cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              {!collapsed && <span>Uitloggen</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
