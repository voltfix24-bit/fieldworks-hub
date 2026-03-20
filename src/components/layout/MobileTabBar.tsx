import { useLocation, useNavigate } from 'react-router-dom';
import { Home, CalendarDays, FolderOpen, MoreHorizontal } from 'lucide-react';
import { GroundingIcon } from '@/components/measurement/GroundingIcon';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

const TAB_ITEMS = [
  { key: 'start', label: 'Start', icon: Home, path: '/dashboard' },
  { key: 'planning', label: 'Planning', icon: CalendarDays, path: '/planning' },
  { key: 'meten', label: 'Meten', icon: null, path: '/projects' },
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

  if (!isMobile) return null;
  if (HIDDEN_ROUTE_PATTERNS.some(p => p.test(location.pathname))) return null;

  const activeKey = getActiveKey(location.pathname);

  return (
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
        <div className="flex items-end justify-around px-1.5 pt-1 pb-2">
          {TAB_ITEMS.map((tab) => {
            const isCenter = tab.key === 'meten';
            const isActive = activeKey === tab.key;

            if (isCenter) {
              return (
                <CenterAction
                  key={tab.key}
                  isActive={isActive}
                  onTap={() => navigate(tab.path)}
                />
              );
            }

            const Icon = tab.icon!;

            return (
              <button
                key={tab.key}
                onClick={() => navigate(tab.path)}
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 py-2 px-3 rounded-xl',
                  'transition-colors duration-150 min-w-[52px]',
                  'active:scale-[0.96]',
                  isActive
                    ? 'text-[hsl(var(--tenant-primary))]'
                    : 'text-muted-foreground/50'
                )}
              >
                <Icon className={cn(
                  'h-5 w-5 transition-colors duration-150',
                  isActive && 'stroke-[2.2]'
                )} />
                <span className={cn(
                  'text-[10px] leading-tight transition-colors duration-150',
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
  );
}

function CenterAction({ isActive, onTap }: { isActive: boolean; onTap: () => void }) {
  return (
    <div className="flex flex-col items-center -mt-3.5 px-1">
      <button
        onClick={onTap}
        className={cn(
          'w-[50px] h-[50px] rounded-[18px]',
          'flex items-center justify-center',
          'bg-[hsl(var(--tenant-primary))] text-[hsl(var(--tenant-primary-foreground,0_0%_100%))]',
          'shadow-[0_3px_12px_-2px_hsl(var(--tenant-primary)/0.35)]',
          'transition-all duration-150',
          'active:scale-[0.93]'
        )}
      >
        <GroundingIcon size={22} />
      </button>
      <span className={cn(
        'text-[10px] leading-tight mt-1 font-semibold transition-colors duration-150',
        isActive ? 'text-[hsl(var(--tenant-primary))]' : 'text-muted-foreground/50'
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
