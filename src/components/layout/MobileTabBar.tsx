import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, CalendarDays, FolderOpen, MoreHorizontal, Plus, RotateCcw, Search, ChevronRight } from 'lucide-react';
import { GroundingIcon } from '@/components/measurement/GroundingIcon';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';

const TAB_ITEMS = [
  { key: 'start', label: 'Start', icon: Home, path: '/dashboard' },
  { key: 'planning', label: 'Planning', icon: CalendarDays, path: '/planning' },
  { key: 'meten', label: 'Meten', icon: null, path: null },
  { key: 'projecten', label: 'Projecten', icon: FolderOpen, path: '/projects' },
  { key: 'meer', label: 'Meer', icon: MoreHorizontal, path: '/meer' },
];

const HIDDEN_ROUTE_PATTERNS = [
  /\/projects\/[^/]+\/measurements/,
  /\/projects\/[^/]+\/report/,
  /\/projects\/new$/,
  /\/projects\/[^/]+\/edit$/,
];

export function MobileTabBar() {
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [lastProjectId, setLastProjectId] = useState<string | null>(null);
  const [lastProjectName, setLastProjectName] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from('project_measurement_sessions')
      .select('project_id, updated_at, projects!inner(id, project_name)')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setLastProjectId(data.project_id);
          setLastProjectName((data as any).projects?.project_name || null);
          setLastUpdatedAt(data.updated_at);
        }
      });
  }, [location.pathname]);

  if (!isMobile) return null;
  if (HIDDEN_ROUTE_PATTERNS.some(p => p.test(location.pathname))) return null;

  const activeKey = getActiveKey(location.pathname);
  const timeAgo = lastUpdatedAt
    ? formatDistanceToNow(new Date(lastUpdatedAt), { addSuffix: true, locale: nl })
    : null;

  return (
    <>
      {/* Overlay */}
      {sheetOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-md md:hidden animate-in fade-in duration-200"
          onClick={() => setSheetOpen(false)}
        />
      )}

      {/* Action Sheet */}
      {sheetOpen && (
        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden sheet-enter">
          <div className="mx-3 mb-[calc(5rem+env(safe-area-inset-bottom,0px))] rounded-2xl glass-surface-elevated overflow-hidden">
            {/* Handle */}
            <div className="flex justify-center pt-2.5 pb-1">
              <div className="w-9 h-[3px] rounded-full bg-foreground/10" />
            </div>

            <div className="px-5 pt-1 pb-2">
              <h3 className="text-[16px] font-semibold text-foreground tracking-tight">Start meting</h3>
              <p className="text-[12px] text-muted-foreground/50 mt-0.5">Kies hoe je verder wilt gaan</p>
            </div>

            <div className="px-2 pb-2.5 space-y-px">
              <SheetAction
                icon={Plus}
                label="Nieuw project"
                sublabel="Start een nieuw meetproject"
                onClick={() => { setSheetOpen(false); navigate('/projects/new'); }}
              />
              <SheetAction
                icon={Search}
                label="Bestaand project"
                sublabel="Zoek en open een project"
                onClick={() => { setSheetOpen(false); navigate('/projects'); }}
              />
              {lastProjectId && (
                <>
                  <div className="h-px bg-border/20 mx-3 my-1" />
                  <SheetAction
                    icon={RotateCcw}
                    label="Hervatten"
                    sublabel={[lastProjectName, timeAgo].filter(Boolean).join(' · ')}
                    highlight
                    onClick={() => { setSheetOpen(false); navigate(`/projects/${lastProjectId}/measurements`); }}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
        <nav
          className={cn(
            'mx-2 mb-2 rounded-[22px]',
            'glass-surface',
            sheetOpen && 'opacity-40 pointer-events-none'
          )}
        >
          <div className="flex items-end justify-around px-1 pt-1 pb-1.5 safe-bottom">
            {TAB_ITEMS.map((tab) => {
              const isCenter = tab.key === 'meten';
              const isActive = activeKey === tab.key;

              if (isCenter) {
                return (
                  <CenterAction
                    key={tab.key}
                    isActive={sheetOpen}
                    onTap={() => setSheetOpen(prev => !prev)}
                  />
                );
              }

              const Icon = tab.icon!;

              return (
                <button
                  key={tab.key}
                  onClick={() => { setSheetOpen(false); navigate(tab.path!); }}
                  className={cn(
                    'relative flex flex-col items-center justify-center gap-[3px] py-1.5 px-3 rounded-xl',
                    'transition-all duration-200 min-w-[52px]',
                    'active:scale-[0.92]',
                    isActive
                      ? 'text-foreground'
                      : 'text-muted-foreground/35'
                  )}
                >
                  <Icon className={cn(
                    'h-[19px] w-[19px] transition-all duration-200',
                    isActive ? 'stroke-[2.2]' : 'stroke-[1.6]'
                  )} />
                  <span className={cn(
                    'text-[10px] leading-none transition-all duration-200',
                    isActive ? 'font-semibold' : 'font-medium'
                  )}>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </>
  );
}

function CenterAction({ isActive, onTap }: { isActive: boolean; onTap: () => void }) {
  const [pulse, setPulse] = useState(false);

  const handleTap = () => {
    setPulse(true);
    if (navigator.vibrate) navigator.vibrate(8);
    onTap();
    setTimeout(() => setPulse(false), 400);
  };

  return (
    <div className="flex flex-col items-center -mt-3.5 px-1 z-[60]">
      <button
        onClick={handleTap}
        className={cn(
          'relative w-[46px] h-[46px] rounded-full',
          'flex items-center justify-center',
          'bg-[hsl(var(--tenant-primary))] text-white',
          'shadow-[0_2px_16px_-2px_hsl(var(--tenant-primary)/0.35)]',
          'transition-all duration-200',
          'active:scale-[0.88]',
          isActive && 'ring-[2.5px] ring-[hsl(var(--tenant-primary)/0.2)] ring-offset-2 ring-offset-transparent'
        )}
      >
        {pulse && (
          <span className="absolute inset-0 rounded-full animate-[ping_0.4s_ease-out_forwards] bg-[hsl(var(--tenant-primary)/0.15)]" />
        )}
        <GroundingIcon size={19} />
      </button>
      <span className={cn(
        'text-[10px] leading-none mt-[3px] font-medium transition-colors duration-150',
        isActive ? 'text-[hsl(var(--tenant-primary))]' : 'text-muted-foreground/35'
      )}>
        Meten
      </span>
    </div>
  );
}

function SheetAction({ icon: Icon, label, sublabel, highlight, onClick }: {
  icon: React.ElementType; label: string; sublabel?: string; highlight?: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl active:bg-foreground/[0.04] transition-colors text-left',
      )}
    >
      <div className={cn(
        'h-9 w-9 rounded-[11px] flex items-center justify-center shrink-0',
        highlight ? 'bg-[hsl(var(--tenant-primary)/0.1)]' : 'bg-foreground/[0.04]'
      )}>
        <Icon className={cn(
          'h-[16px] w-[16px]',
          highlight ? 'text-[hsl(var(--tenant-primary))]' : 'text-muted-foreground/60'
        )} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-[14px] font-semibold leading-snug',
          highlight ? 'text-[hsl(var(--tenant-primary))]' : 'text-foreground'
        )}>{label}</p>
        {sublabel && (
          <p className="text-[11px] text-muted-foreground/45 truncate mt-0.5">{sublabel}</p>
        )}
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground/15 shrink-0" />
    </button>
  );
}

function getActiveKey(pathname: string): string {
  if (pathname.startsWith('/planning')) return 'planning';
  if (pathname.startsWith('/meer') || pathname.startsWith('/settings')) return 'meer';
  if (pathname.startsWith('/projects')) return 'projecten';
  if (pathname === '/dashboard' || pathname === '/') return 'start';
  return 'start';
}
