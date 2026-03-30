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
    <aside className="w-[260px] shrink-0 h-screen sticky top-0 flex flex-col bg-sidebar text-sidebar-foreground">
      {/* Logo area */}
      <button onClick={() => navigate('/dashboard')} className="px-6 pt-8 pb-8 text-left hover:opacity-80 transition-opacity">
        {branding?.compact_logo_url || branding?.logo_url ? (
          <img
            src={branding.compact_logo_url || branding.logo_url!}
            alt={tenant?.company_name || 'Logo'}
            className="h-9 w-auto max-w-[180px] object-contain brightness-0 invert"
          />
        ) : (
          <h1 className="font-display text-[22px] font-black uppercase tracking-tight text-[hsl(var(--sidebar-primary))]">
            {tenant?.company_name || 'Aardpen'}
          </h1>
        )}
        <p className="text-[10px] uppercase tracking-[0.25em] text-white/30 mt-1.5 font-medium">
          Safe · Skilled · Solid
        </p>
      </button>

      {/* Main nav */}
      <nav className="flex-1 px-4 space-y-0.5">
        {mainNav.map((item) => {
          const active = isActive(item.url);
          return (
            <button
              key={item.title}
              onClick={() => navigate(item.url)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded text-left transition-all duration-150',
                'text-[11px] font-bold uppercase tracking-[0.15em]',
                active
                  ? 'text-white bg-white/[0.08] border-l-[3px] border-[hsl(var(--sidebar-primary))] -ml-px shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04] border-l-[3px] border-transparent -ml-px'
              )}
            >
              <item.icon className={cn(
                'h-[18px] w-[18px] shrink-0 transition-colors',
                active ? 'text-[hsl(var(--sidebar-primary))]' : ''
              )} />
              <span>{item.title}</span>
            </button>
          );
        })}

        {/* Separator */}
        <div className="h-px bg-white/[0.06] my-5 mx-1" />

        {/* Settings */}
        <button
          onClick={() => navigate('/settings')}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded text-left transition-all duration-150',
            'text-[11px] font-bold uppercase tracking-[0.15em]',
            isActive('/settings')
              ? 'text-white bg-white/[0.08] border-l-[3px] border-[hsl(var(--sidebar-primary))] -ml-px'
              : 'text-white/40 hover:text-white/70 hover:bg-white/[0.04] border-l-[3px] border-transparent -ml-px'
          )}
        >
          <Settings className="h-[18px] w-[18px] shrink-0" />
          <span>Instellingen</span>
        </button>
      </nav>

      {/* Footer */}
      <div className="px-4 pb-6 pt-3">
        <div className="h-px bg-white/[0.06] mb-4 mx-1" />
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded text-left transition-all duration-150 text-[11px] font-bold uppercase tracking-[0.15em] text-white/25 hover:text-red-400 hover:bg-red-500/[0.06] border-l-[3px] border-transparent -ml-px"
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          <span>Uitloggen</span>
        </button>
        <p className="text-[10px] text-white/15 mt-5 px-3 font-medium">
          {plannedCount} actieve projecten
        </p>
      </div>
    </aside>
  );
}
