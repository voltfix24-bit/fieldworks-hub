import {
  LayoutDashboard, FolderKanban, Users, HardHat,
  Wrench, FileText, Settings, LogOut, Calendar,
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
  { title: 'Klanten', url: '/clients', icon: Users },
  { title: 'Monteurs', url: '/technicians', icon: HardHat },
  { title: 'Apparatuur', url: '/equipment', icon: Wrench },
  { title: 'Rapporten', url: '/reports', icon: FileText },
];

export function AppSidebar() {
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();
  const { tenant } = useTenant();
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
      <button onClick={() => navigate('/dashboard')} className="px-6 pt-7 pb-6 text-left hover:opacity-80 transition-opacity">
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
        <p className="text-[11px] uppercase tracking-[0.2em] text-white/50 mt-1 font-medium">
          Safe · Skilled · Solid
        </p>
      </button>

      {/* Main nav */}
      <nav className="flex-1 px-3 space-y-0.5">
        {mainNav.map((item) => {
          const active = isActive(item.url);
          return (
            <button
              key={item.title}
              onClick={() => navigate(item.url)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded text-left transition-colors',
                'text-[11px] font-bold uppercase tracking-[0.15em]',
                active
                  ? 'text-[hsl(var(--sidebar-primary))] bg-white/5 border-l-[3px] border-[hsl(var(--sidebar-primary))] -ml-px'
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border-l-[3px] border-transparent -ml-px'
              )}
            >
              <item.icon className="h-[18px] w-[18px] shrink-0" />
              <span>{item.title}</span>
            </button>
          );
        })}

        {/* Separator */}
        <div className="h-px bg-white/10 my-4 mx-2" />

        {/* Settings */}
        <button
          onClick={() => navigate('/settings')}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded text-left transition-colors',
            'text-[11px] font-bold uppercase tracking-[0.15em]',
            isActive('/settings')
              ? 'text-[hsl(var(--sidebar-primary))] bg-white/5 border-l-[3px] border-[hsl(var(--sidebar-primary))] -ml-px'
              : 'text-slate-400 hover:text-white hover:bg-white/5 border-l-[3px] border-transparent -ml-px'
          )}
        >
          <Settings className="h-[18px] w-[18px] shrink-0" />
          <span>Instellingen</span>
        </button>
      </nav>

      {/* Footer */}
      <div className="px-3 pb-6 pt-2">
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded text-left transition-colors text-[11px] font-bold uppercase tracking-[0.15em] text-red-400 hover:text-red-300 hover:bg-red-500/10 border-l-[3px] border-transparent -ml-px"
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          <span>Uitloggen</span>
        </button>
        <p className="text-[10px] text-white/20 mt-4 px-3">
          {plannedCount} actieve projecten
        </p>
      </div>
    </aside>
  );
}
