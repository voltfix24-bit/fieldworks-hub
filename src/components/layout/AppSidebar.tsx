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
    <aside className="w-[264px] shrink-0 h-screen sticky top-0 flex flex-col bg-[hsl(215_50%_12%)] text-white/80 select-none">
      {/* ── Branding ── */}
      <button
        onClick={() => navigate('/dashboard')}
        className="block text-left px-8 pt-10 pb-10 group"
      >
        {branding?.compact_logo_url || branding?.logo_url ? (
          <img
            src={branding.compact_logo_url || branding.logo_url!}
            alt={tenant?.company_name || 'Logo'}
            className="h-8 w-auto max-w-[160px] object-contain brightness-0 invert opacity-85 group-hover:opacity-100 transition-opacity duration-300"
          />
        ) : (
          <span className="font-display text-[20px] font-black uppercase tracking-[0.04em] text-white/90 group-hover:text-white transition-colors duration-300">
            {tenant?.company_name || 'Aardpen'}
          </span>
        )}
        <span className="block text-[8px] uppercase tracking-[0.4em] text-white/[0.08] mt-3 font-bold">
          Field Operations
        </span>
      </button>

      {/* ── Main nav ── */}
      <nav className="flex-1 px-4 space-y-0.5 overflow-y-auto scrollbar-none">
        {mainNav.map((item) => {
          const active = isActive(item.url);
          return (
            <button
              key={item.title}
              onClick={() => navigate(item.url)}
              className={cn(
                'w-full flex items-center gap-3.5 px-4 py-[11px] rounded-xl text-left transition-all duration-200 relative group',
                active
                  ? 'bg-white/[0.1] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_1px_3px_rgba(0,0,0,0.15)]'
                  : 'text-white/[0.28] hover:text-white/50 hover:bg-white/[0.04]'
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.5)]" />
              )}
              <item.icon className={cn(
                'h-[18px] w-[18px] shrink-0 transition-all duration-200',
                active ? 'text-primary' : 'group-hover:text-white/40'
              )} />
              <span className={cn(
                'text-[11px] tracking-[0.06em] transition-all duration-200',
                active ? 'font-bold' : 'font-semibold'
              )}>
                {item.title}
              </span>
            </button>
          );
        })}
      </nav>

      {/* ── Footer ── */}
      <div className="px-4 pb-7 pt-3">
        <div className="h-px bg-white/[0.04] mx-3 mb-3" />

        <button
          onClick={() => navigate('/settings')}
          className={cn(
            'w-full flex items-center gap-3.5 px-4 py-[11px] rounded-xl text-left transition-all duration-200 relative group',
            isActive('/settings')
              ? 'bg-white/[0.1] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_1px_3px_rgba(0,0,0,0.15)]'
              : 'text-white/[0.28] hover:text-white/50 hover:bg-white/[0.04]'
          )}
        >
          {isActive('/settings') && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.5)]" />
          )}
          <Settings className={cn('h-[18px] w-[18px] shrink-0', isActive('/settings') ? 'text-primary' : 'group-hover:text-white/40')} />
          <span className={cn(
            'text-[11px] tracking-[0.06em]',
            isActive('/settings') ? 'font-bold' : 'font-semibold'
          )}>Instellingen</span>
        </button>

        <button
          onClick={signOut}
          className="w-full flex items-center gap-3.5 px-4 py-[11px] rounded-xl text-left transition-all duration-200 text-white/[0.15] hover:text-red-400/70 hover:bg-red-500/[0.06] group"
        >
          <LogOut className="h-[18px] w-[18px] shrink-0 group-hover:text-red-400/70" />
          <span className="text-[11px] font-semibold tracking-[0.06em]">Uitloggen</span>
        </button>

        <div className="mt-4 mx-4 px-3 py-2 rounded-lg bg-white/[0.03]">
          <p className="text-[9px] text-white/[0.12] font-semibold tracking-[0.08em]">
            {plannedCount} actieve projecten
          </p>
        </div>
      </div>
    </aside>
  );
}
