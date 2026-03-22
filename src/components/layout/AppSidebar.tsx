import {
  LayoutDashboard, FolderKanban, Users, HardHat,
  Wrench, FileText, Settings, LogOut, Building2, Calendar,
} from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarFooter, useSidebar,
} from '@/components/ui/sidebar';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';
import { useProjects } from '@/hooks/use-projects';

const mainNav = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Planning', url: '/planning', icon: Calendar },
  { title: 'Projecten', url: '/projects', icon: FolderKanban },
  { title: 'Klanten', url: '/clients', icon: Users },
  { title: 'Monteurs', url: '/technicians', icon: HardHat },
  { title: 'Apparatuur', url: '/equipment', icon: Wrench },
  { title: 'Rapporten', url: '/reports', icon: FileText },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const { tenant, branding } = useTenant();
  const { signOut } = useAuth();
  const { data: projects } = useProjects();
  const plannedCount = projects?.filter(p => p.status === 'planned').length ?? 0;

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="p-4 flex items-center gap-3">
          {branding?.logo_url ? (
            <img src={branding.logo_url} alt={tenant?.company_name || 'Logo'} className="h-9 w-9 rounded-lg object-contain shrink-0" />
          ) : (
            <div className="h-9 w-9 rounded-lg tenant-primary-bg flex items-center justify-center shrink-0">
              <Building2 className="h-4 w-4 text-sidebar-primary-foreground" />
            </div>
          )}
          {!collapsed && (
            <div className="min-w-0">
              <span className="text-[14px] font-bold text-sidebar-foreground truncate block">{tenant?.company_name || 'Uw Bedrijf'}</span>
              <span className="text-[10px] text-sidebar-foreground/40 truncate block">{plannedCount} actieve projecten</span>
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end={item.url === '/dashboard'} className="hover:bg-sidebar-accent" activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium">
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
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/settings" className="hover:bg-sidebar-accent" activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium">
                    <Settings className="mr-2 h-4 w-4" />
                    {!collapsed && <span>Instellingen</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={signOut} className="hover:bg-sidebar-accent cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              {!collapsed && <span>Uitloggen</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
