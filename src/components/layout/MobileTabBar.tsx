import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, CalendarDays, FolderOpen, MoreHorizontal, Plus, RotateCcw, Search } from 'lucide-react';
import { GroundingIcon } from '@/components/measurement/GroundingIcon';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';

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
];

export function MobileTabBar() {
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [lastProjectId, setLastProjectId] = useState<string | null>(null);
  const [lastProjectName, setLastProjectName] = useState<string | null>(null);

  // Fetch most recent project with a measurement session
  useEffect(() => {
    supabase
      .from('project_measurement_sessions')
      .select('project_id, projects!inner(id, project_name)')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setLastProjectId(data.project_id);
          setLastProjectName((data as any).projects?.project_name || null);
        }
      });
  }, [location.pathname]);

  if (!isMobile) return null;
  if (HIDDEN_ROUTE_PATTERNS.some(p => p.test(location.pathname))) return null;

  const activeKey = getActiveKey(location.pathname);

  return (
    <>
      {/* Overlay */}
      {sheetOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] md:hidden animate-in fade-in duration-200"
          onClick={() => setSheetOpen(false)}
        />
      )}

      {/* Action Sheet */}
      {sheetOpen && (
        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden animate-in slide-in-from-bottom duration-250">
          <div className="mx-3 mb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] rounded-2xl bg-card border border-border/40 shadow-xl overflow-hidden">
            <div className="px-4 pt-3.5 pb-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Snelle actie</p>
            </div>
            <div className="px-2 pb-2 space-y-0.5">
              <ActionSheetItem
                icon={Plus}
                label="Nieuw project aanmaken"
                onClick={() => { setSheetOpen(false); navigate('/projects/new'); }}
              />
              <ActionSheetItem
                icon={Search}
                label="Bestaand project openen"
                onClick={() => { setSheetOpen(false); navigate('/projects'); }}
              />
              {lastProjectId ? (
                <ActionSheetItem
                  icon={RotateCcw}
                  label="Laatste meting hervatten"
                  sublabel={lastProjectName || undefined}
                  onClick={() => { setSheetOpen(false); navigate(`/projects/${lastProjectId}/measurements`); }}
                />
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Tab Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
        <nav
          className={cn(
            'mx-2.5 mb-2.5 rounded-2xl',
            'bg-card/98 backdrop-blur-2xl',
            'border border-border/30',
            'shadow-[0_-4px_24px_-6px_hsl(var(--foreground)/0.06),0_-1px_4px_-1px_hsl(var(--foreground)/0.03)]',
            'safe-bottom'
          )}
        >
          <div className="flex items-end justify-around px-1.5 pt-1 pb-1.5">
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
                    'relative flex flex-col items-center justify-center gap-0.5 py-1.5 px-3 rounded-xl',
                    'transition-all duration-200 min-w-[52px]',
                    'active:scale-[0.93]',
                    isActive
                      ? 'text-[hsl(var(--tenant-primary))]'
                      : 'text-muted-foreground/50'
                  )}
                >
                  {/* Active indicator dot */}
                  <span className={cn(
                    'absolute -top-0.5 left-1/2 -translate-x-1/2 h-[3px] rounded-full bg-[hsl(var(--tenant-primary))]',
                    'transition-all duration-300 ease-out',
                    isActive ? 'w-4 opacity-100' : 'w-0 opacity-0'
                  )} />
                  <Icon className={cn(
                    'h-[18px] w-[18px] transition-all duration-200',
                    isActive ? 'stroke-[2.2] scale-110' : 'scale-100'
                  )} />
                  <span className={cn(
                    'text-[10px] leading-tight transition-all duration-200',
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
    // Trigger haptic feedback if available
    if (navigator.vibrate) navigator.vibrate(8);
    onTap();
    setTimeout(() => setPulse(false), 400);
  };

  return (
    <div className="flex flex-col items-center -mt-3 px-1">
      <button
        onClick={handleTap}
        className={cn(
          'relative w-[46px] h-[46px] rounded-[16px]',
          'flex items-center justify-center',
          'bg-[hsl(var(--tenant-primary))] text-[hsl(var(--tenant-primary-foreground,0_0%_100%))]',
          'shadow-[0_3px_12px_-2px_hsl(var(--tenant-primary)/0.35)]',
          'transition-all duration-150',
          'active:scale-[0.90]',
          isActive && 'ring-2 ring-[hsl(var(--tenant-primary)/0.3)] ring-offset-2 ring-offset-card'
        )}
      >
        {/* Ripple pulse */}
        {pulse && (
          <span className="absolute inset-0 rounded-[16px] animate-[ping_0.4s_ease-out_forwards] bg-[hsl(var(--tenant-primary)/0.25)]" />
        )}
        <GroundingIcon size={20} />
      </button>
      <span className={cn(
        'text-[10px] leading-tight mt-0.5 font-semibold transition-colors duration-150',
        isActive ? 'text-[hsl(var(--tenant-primary))]' : 'text-muted-foreground/50'
      )}>
        Meten
      </span>
    </div>
  );
}

function ActionSheetItem({ icon: Icon, label, sublabel, onClick }: {
  icon: React.ElementType;
  label: string;
  sublabel?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/60 active:bg-muted transition-colors text-left"
    >
      <div className="h-9 w-9 rounded-xl bg-[hsl(var(--tenant-primary)/0.08)] flex items-center justify-center shrink-0">
        <Icon className="h-4.5 w-4.5 text-[hsl(var(--tenant-primary))]" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {sublabel && <p className="text-xs text-muted-foreground">{sublabel}</p>}
      </div>
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
