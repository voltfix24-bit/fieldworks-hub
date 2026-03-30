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
    <aside className="w-[252px] shrink-0 h-screen sticky top-0 flex flex-col bg-[hsl(215_50%_14%)] text-sidebar-foreground">
      {/* Branding */}
      <button
        onClick={() => navigate('/dashboard')}
        className="block text-left px-7 pt-9 pb-8 group"
      >
        {branding?.compact_logo_url || branding?.logo_url ? (
          <img
            src={branding.compact_logo_url || branding.logo_url!}
            alt={tenant?.company_name || 'Logo'}
            className="h-7 w-auto max-w-[150px] object-contain brightness-0 invert opacity-90 group-hover:opacity-100 transition-opacity"
          />
        ) : (
          <span className="font-display text-[19px] font-black uppercase tracking-wide text-white/90 group-hover:text-white transition-colors">
            {tenant?.company_name || 'Aardpen'}
          </span>
        )}
        <span className="block text-[8px] uppercase tracking-[0.35em] text-white/15 mt-2.5 font-semibold select-none">
          Safe · Skilled · Solid
        </span>
      </button>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-px overflow-y-auto scrollbar-none">
        {mainNav.map((item) => {
          const active = isActive(item.url);
          return (
            <button
              key={item.title}
              onClick={() => navigate(item.url)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-[9px] rounded-[10px] text-left transition-all duration-200 relative',
                'text-[10.5px] font-extrabold uppercase tracking-[0.16em]',
                active
                  ? 'text-white bg-white/[0.07]'
                  : 'text-white/30 hover:text-white/55 hover:bg-white/[0.03]'
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-sidebar-primary" />
              )}
              <item.icon className={cn(
                'h-[16px] w-[16px] shrink-0 transition-colors duration-200',
                active ? 'text-sidebar-primary' : ''
              )} />
              <span className="flex-1">{item.title}</span>
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-6 pt-2 space-y-px">
        <div className="h-px bg-white/[0.05] mx-3 mb-2" />

        <button
          onClick={() => navigate('/settings')}
          className={cn(
            'w-full flex items-center gap-3 px-4 py-[9px] rounded-[10px] text-left transition-all duration-200 relative',
            'text-[10.5px] font-extrabold uppercase tracking-[0.16em]',
            isActive('/settings')
              ? 'text-white bg-white/[0.07]'
              : 'text-white/30 hover:text-white/55 hover:bg-white/[0.03]'
          )}
        >
          {isActive('/settings') && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 rounded-r-full bg-sidebar-primary" />
          )}
          <Settings className={cn('h-[16px] w-[16px] shrink-0', isActive('/settings') ? 'text-sidebar-primary' : '')} />
          <span>Instellingen</span>
        </button>

        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-4 py-[9px] rounded-[10px] text-left transition-all duration-200 text-[10.5px] font-extrabold uppercase tracking-[0.16em] text-white/18 hover:text-red-400/80 hover:bg-red-500/[0.06]"
        >
          <LogOut className="h-[16px] w-[16px] shrink-0" />
          <span>Uitloggen</span>
        </button>

        <p className="text-[9px] text-white/12 pt-4 px-4 font-medium tracking-wide">
          {plannedCount} actieve projecten
        </p>
      </div>
    </aside>
  );
}
