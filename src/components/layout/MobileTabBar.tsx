import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { GroundingIcon } from '@/components/measurement/GroundingIcon';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { nl } from 'date-fns/locale';

const TAB_ITEMS = [
  { key: 'start', label: 'Start', path: '/dashboard' },
  { key: 'planning', label: 'Planning', path: '/planning' },
  { key: 'meten', label: 'Meten', path: null },
  { key: 'projecten', label: 'Projecten', path: '/projects' },
  { key: 'meer', label: 'Meer', path: '/meer' },
];

const HIDDEN_ROUTE_PATTERNS = [
  /\/projects\/[^/]+\/measurements/,
  /\/projects\/[^/]+\/report/,
  /\/projects\/new$/,
  /\/projects\/[^/]+\/edit$/,
];

/* ── Tab Icons (inline SVG for iOS precision) ── */
function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M3 10.5L12 3L21 10.5V20C21 20.55 20.55 21 20 21H15V15H9V21H4C3.45 21 3 20.55 3 20V10.5Z"
        stroke={active ? 'hsl(var(--tenant-primary))' : 'hsl(var(--muted-foreground) / 0.4)'}
        strokeWidth={active ? '2' : '1.5'}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={active ? 'hsl(var(--tenant-primary) / 0.1)' : 'none'}
      />
    </svg>
  );
}
function CalIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="18" rx="3"
        stroke={active ? 'hsl(var(--tenant-primary))' : 'hsl(var(--muted-foreground) / 0.4)'}
        strokeWidth={active ? '2' : '1.5'} />
      <path d="M16 2V6M8 2V6M3 10H21"
        stroke={active ? 'hsl(var(--tenant-primary))' : 'hsl(var(--muted-foreground) / 0.4)'}
        strokeWidth={active ? '2' : '1.5'} strokeLinecap="round" />
    </svg>
  );
}
function FolderIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M3 7C3 5.9 3.9 5 5 5H9L11 7H19C20.1 7 21 7.9 21 9V18C21 19.1 20.1 20 19 20H5C3.9 20 3 19.1 3 18V7Z"
        stroke={active ? 'hsl(var(--tenant-primary))' : 'hsl(var(--muted-foreground) / 0.4)'}
        strokeWidth={active ? '2' : '1.5'}
        fill={active ? 'hsl(var(--tenant-primary) / 0.1)' : 'none'} />
    </svg>
  );
}
function MoreIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      {[6, 12, 18].map(cy => (
        <circle key={cy} cx="12" cy={cy} r="1.5"
          fill={active ? 'hsl(var(--tenant-primary))' : 'hsl(var(--muted-foreground) / 0.4)'} />
      ))}
    </svg>
  );
}

const TAB_ICONS: Record<string, React.FC<{ active: boolean }>> = {
  start: HomeIcon,
  planning: CalIcon,
  projecten: FolderIcon,
  meer: MoreIcon,
};

/* ── Sheet action icons ── */
function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M12 5V19M5 12H19" stroke="hsl(var(--muted-foreground) / 0.6)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="11" cy="11" r="7" stroke="hsl(var(--muted-foreground) / 0.6)" strokeWidth="1.8" />
      <path d="M16 16L21 21" stroke="hsl(var(--muted-foreground) / 0.6)" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function ResumeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M1 4V10H7" stroke="hsl(var(--tenant-primary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3.51 15A9 9 0 105.64 5.64L1 10" stroke="hsl(var(--tenant-primary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function MobileTabBar() {
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [lastProjectId, setLastProjectId] = useState<string | null>(null);
  const [lastProjectName, setLastProjectName] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const sheetStartY = useRef(0);
  const [sheetDragY, setSheetDragY] = useState(0);
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
      {/* ── Sheet Backdrop ── */}
      <div
        className={cn(
          'fixed inset-0 z-[200] transition-all duration-300',
          sheetOpen
            ? 'bg-black/30 backdrop-blur-sm pointer-events-auto'
            : 'bg-transparent pointer-events-none'
        )}
        onClick={() => setSheetOpen(false)}
      />

      {/* ── Bottom Sheet ── */}
      <div className={cn(
        'fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-[300]',
        'rounded-t-3xl',
        'border-t border-white/60',
        'pb-10 transition-transform duration-[400ms]',
        'bg-background/95 backdrop-blur-[40px]',
        'shadow-[0_-8px_40px_rgba(0,0,0,0.14)]',
        sheetOpen ? 'translate-y-0' : 'translate-y-full'
      )}>
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-5">
          <div className="w-9 h-[5px] rounded-full bg-foreground/20" />
        </div>

        <div className="px-5 pb-1">
          <h3 className="text-xl font-extrabold text-foreground tracking-tight">Start meting</h3>
          <p className="text-sm text-muted-foreground mt-1 pb-5">Kies hoe je verder wilt gaan</p>
        </div>

        <div className="mx-4 rounded-2xl bg-card overflow-hidden shadow-[0_1px_0_rgba(0,0,0,0.04)]">
          {/* Nieuw project */}
          <button
            onClick={() => { setSheetOpen(false); navigate('/projects/new'); }}
            className="w-full flex items-center gap-3.5 px-4 py-3.5 min-h-[68px] active:bg-foreground/[0.04] transition-colors text-left"
          >
            <div className="h-9 w-9 rounded-[10px] flex items-center justify-center shrink-0 bg-[hsl(0_0%_0%/0.04)]">
              <PlusIcon />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-semibold text-foreground">Nieuw project</p>
              <p className="text-[13px] text-muted-foreground mt-0.5">Start een nieuw meetproject</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground/20 shrink-0" />
          </button>

          <div className="h-px bg-background mx-4" />

          {/* Bestaand project */}
          <button
            onClick={() => { setSheetOpen(false); navigate('/projects'); }}
            className="w-full flex items-center gap-3.5 px-4 py-3.5 min-h-[68px] active:bg-foreground/[0.04] transition-colors text-left"
          >
            <div className="h-9 w-9 rounded-[10px] flex items-center justify-center shrink-0 bg-[hsl(0_0%_0%/0.04)]">
              <SearchIcon />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-semibold text-foreground">Bestaand project</p>
              <p className="text-[13px] text-muted-foreground mt-0.5">Zoek en open een project</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground/20 shrink-0" />
          </button>

          {/* Hervatten */}
          {lastProjectId && (
            <>
              <div className="h-px bg-background mx-4" />
              <button
                onClick={() => { setSheetOpen(false); navigate(`/projects/${lastProjectId}/measurements`); }}
                className="w-full flex items-center gap-3.5 px-4 py-3.5 min-h-[68px] active:bg-foreground/[0.04] transition-colors text-left"
              >
                <div className="h-9 w-9 rounded-[10px] flex items-center justify-center shrink-0 bg-[hsl(var(--tenant-primary)/0.12)]">
                  <ResumeIcon />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-semibold text-[hsl(var(--tenant-primary))]">Hervatten</p>
                  <p className="text-[13px] text-muted-foreground mt-0.5 truncate">
                    {[lastProjectName, timeAgo].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/20 shrink-0" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Tab Bar — Liquid Glass Pill ── */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] px-3 pb-[max(12px,env(safe-area-inset-bottom))] z-[100] pointer-events-none">
        <nav className={cn(
          'flex items-center justify-around',
          'rounded-[26px] px-2 py-2.5',
          'pointer-events-auto',
          'bg-background/75 backdrop-blur-[28px] backdrop-saturate-200',
          'border border-white/50',
          'shadow-[0_8px_32px_rgba(0,0,0,0.10),inset_0_1.5px_0_rgba(255,255,255,0.7),inset_0_-0.5px_0_rgba(0,0,0,0.06)]',
          sheetOpen && 'opacity-40 pointer-events-none'
        )}>
          {TAB_ITEMS.map((tab) => {
            if (tab.key === 'meten') {
              return (
                <CenterFab
                  key={tab.key}
                  isOpen={sheetOpen}
                  onTap={() => setSheetOpen(prev => !prev)}
                />
              );
            }

            const Icon = TAB_ICONS[tab.key];
            const isActive = activeKey === tab.key;

            return (
              <button
                key={tab.key}
                onClick={() => { setSheetOpen(false); navigate(tab.path!); }}
                className="flex flex-col items-center gap-[3px] min-w-[56px] py-0.5 active:opacity-50 active:scale-[0.93] transition-all"
              >
                <div className="w-7 h-7 flex items-center justify-center">
                  {Icon && <Icon active={isActive} />}
                </div>
                <span className={cn(
                  'text-[10px] leading-none tracking-[0.1px]',
                  isActive
                    ? 'font-semibold text-[hsl(var(--tenant-primary))]'
                    : 'font-medium text-muted-foreground/40'
                )}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
}

/* ── Center FAB ── */
function CenterFab({ isOpen, onTap }: { isOpen: boolean; onTap: () => void }) {
  const [pulse, setPulse] = useState(false);

  const handleTap = () => {
    setPulse(true);
    if (navigator.vibrate) navigator.vibrate(8);
    onTap();
    setTimeout(() => setPulse(false), 400);
  };

  return (
    <div className="flex flex-col items-center gap-1 -mt-5 z-[60]">
      <button
        onClick={handleTap}
        className={cn(
          'relative w-[52px] h-[52px] rounded-full',
          'flex items-center justify-center',
          'bg-gradient-to-br from-[hsl(var(--tenant-primary)/0.85)] to-[hsl(var(--tenant-primary))]',
          'text-white',
          'border-[1.5px] border-white/25',
          'shadow-[0_6px_20px_hsl(var(--tenant-primary)/0.45),0_2px_6px_hsl(var(--tenant-primary)/0.3),inset_0_1px_0_rgba(255,255,255,0.3)]',
          'transition-all duration-150',
          'active:scale-[0.91]',
          isOpen && 'rotate-45 bg-gradient-to-br from-muted-foreground/60 to-muted-foreground/50 shadow-[0_4px_14px_rgba(0,0,0,0.18)]'
        )}
      >
        {pulse && (
          <span className="absolute inset-0 rounded-full animate-[ping_0.4s_ease-out_forwards] bg-[hsl(var(--tenant-primary)/0.15)]" />
        )}
        {isOpen ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 5V19M5 12H19" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        ) : (
          <GroundingIcon size={19} />
        )}
      </button>
      <span className={cn(
        'text-[10px] leading-none font-semibold tracking-[0.1px]',
        isOpen ? 'text-[hsl(var(--tenant-primary))]' : 'text-[hsl(var(--tenant-primary))]'
      )}>
        Meten
      </span>
    </div>
  );
}

function getActiveKey(pathname: string): string {
  if (pathname.startsWith('/planning')) return 'planning';
  if (pathname.startsWith('/meer') || pathname.startsWith('/settings')) return 'meer';
  if (pathname.startsWith('/projects')) return 'projecten';
  if (pathname === '/dashboard' || pathname === '/') return 'start';
  return 'start';
}
