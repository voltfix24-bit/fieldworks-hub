import {
  LayoutDashboard, FolderKanban, Users, HardHat,
  Wrench, FileText, Settings, LogOut, Calendar, Map,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';
import { useProjects } from '@/hooks/use-projects';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

const mainNav = [
  { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  { title: 'Planning', url: '/planning?view=kalender', icon: Calendar },
  { title: 'Projecten', url: '/projects', icon: FolderKanban },
  { title: 'Kaartweergave', url: '/map', icon: Map },
  { title: 'Klanten', url: '/clients', icon: Users },
  { title: 'Monteurs', url: '/technicians', icon: HardHat },
  { title: 'Apparatuur', url: '/equipment', icon: Wrench },
  { title: 'Rapporten', url: '/reports', icon: FileText },
];

export function AppSidebar() {
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();
  const { tenant, branding } = useTenant();
  const { signOut } = useAuth();
  const { data: projects } = useProjects();
  const plannedCount = projects?.filter(p => p.status === 'planned').length ?? 0;

  if (isMobile) return null;

  const isActive = (url: string) => {
    const path = url.split('?')[0];
    if (path === '/dashboard') return location.pathname === '/dashboard' || location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="w-[256px] shrink-0 h-screen sticky top-0 flex flex-col bg-sidebar text-sidebar-foreground border-r border-white/[0.04]">
      {/* Branding area */}
      <div className="px-7 pt-8 pb-7">
        <button onClick={() => navigate('/dashboard')} className="text-left hover:opacity-80 transition-opacity block">
          {branding?.compact_logo_url || branding?.logo_url ? (
            <img
              src={branding.compact_logo_url || branding.logo_url!}
              alt={tenant?.company_name || 'Logo'}
              className="h-8 w-auto max-w-[160px] object-contain brightness-0 invert"
            />
          ) : (
            <h1 className="font-display text-[20px] font-black uppercase tracking-tight text-sidebar-primary">
              {tenant?.company_name || 'Aardpen'}
            </h1>
          )}
        </button>
        <p className="text-[9px] uppercase tracking-[0.3em] text-white/20 mt-2 font-medium">
          Safe · Skilled · Solid
        </p>
      </div>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent mx-5 mb-3" />

      {/* Main nav */}
      <nav className="flex-1 px-4 space-y-[2px] overflow-y-auto scrollbar-none">
        {mainNav.map((item) => {
          const active = isActive(item.url);
          return (
            <button
              key={item.title}
              onClick={() => navigate(item.url)}
              className={cn(
                'w-full flex items-center gap-3.5 px-4 py-[10px] rounded-lg text-left transition-all duration-200',
                'text-[11px] font-bold uppercase tracking-[0.14em]',
                active
                  ? 'text-white bg-sidebar-accent shadow-[0_1px_2px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.06)]'
                  : 'text-white/35 hover:text-white/65 hover:bg-white/[0.03]'
              )}
            >
              <item.icon className={cn(
                'h-[17px] w-[17px] shrink-0 transition-colors duration-200',
                active ? 'text-sidebar-primary' : 'text-white/30'
              )} />
              <span className="flex-1">{item.title}</span>
              {active && (
                <div className="w-1.5 h-1.5 rounded-full bg-sidebar-primary" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="px-4 pb-5 pt-2">
        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent mx-1 mb-3" />

        {/* Settings */}
        <button
          onClick={() => navigate('/settings')}
          className={cn(
            'w-full flex items-center gap-3.5 px-4 py-[10px] rounded-lg text-left transition-all duration-200',
            'text-[11px] font-bold uppercase tracking-[0.14em]',
            isActive('/settings')
              ? 'text-white bg-sidebar-accent'
              : 'text-white/35 hover:text-white/65 hover:bg-white/[0.03]'
          )}
        >
          <Settings className={cn('h-[17px] w-[17px] shrink-0', isActive('/settings') ? 'text-sidebar-primary' : 'text-white/30')} />
          <span>Instellingen</span>
        </button>

        {/* Logout */}
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3.5 px-4 py-[10px] rounded-lg text-left transition-all duration-200 text-[11px] font-bold uppercase tracking-[0.14em] text-white/20 hover:text-destructive hover:bg-destructive/[0.08]"
        >
          <LogOut className="h-[17px] w-[17px] shrink-0" />
          <span>Uitloggen</span>
        </button>

        {/* Project counter */}
        <div className="mt-4 mx-2 px-3 py-2.5 rounded-lg bg-white/[0.03]">
          <p className="text-[10px] text-white/25 font-medium">
            <span className="text-sidebar-primary font-bold">{plannedCount}</span> actieve projecten
          </p>
        </div>
      </div>
    </aside>
  );
}
