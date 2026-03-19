import { useLocation, useNavigate } from 'react-router-dom';
import { Home, CalendarDays, FolderOpen, MoreHorizontal } from 'lucide-react';
import { GroundingIcon } from '@/components/measurement/GroundingIcon';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

const TAB_ITEMS = [
  { key: 'start', label: 'Start', icon: Home, path: '/dashboard' },
  { key: 'planning', label: 'Planning', icon: CalendarDays, path: '/planning' },
  { key: 'meten', label: 'Meten', icon: null, path: '/projects' }, // center action
  { key: 'projecten', label: 'Projecten', icon: FolderOpen, path: '/projects' },
  { key: 'meer', label: 'Meer', icon: MoreHorizontal, path: '/meer' },
];

/** Routes where the tab bar should be hidden (full-screen flows) */
const HIDDEN_ROUTE_PATTERNS = [
  /\/projects\/[^/]+\/measurements/,
  /\/projects\/[^/]+\/report/,
];

export function MobileTabBar() {
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();

  if (!isMobile) return null;

  // Hide on measurement wizard and report screens
  const shouldHide = HIDDEN_ROUTE_PATTERNS.some(p => p.test(location.pathname));
  if (shouldHide) return null;

  const activeKey = getActiveKey(location.pathname);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Tab bar container */}
      <nav
        className={cn(
          'mx-2 mb-2 rounded-2xl',
          'bg-card/95 backdrop-blur-xl',
          'border border-border/40',
          'shadow-[0_-2px_20px_-4px_hsl(var(--foreground)/0.08),0_-1px_6px_-2px_hsl(var(--foreground)/0.04)]',
          'safe-bottom'
        )}
      >
        <div className="flex items-end justify-around px-1 pt-1 pb-1.5">
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
                  'transition-all duration-200 min-w-[56px]',
                  'active:scale-95',
                  isActive
                    ? 'text-[hsl(var(--tenant-primary))]'
                    : 'text-muted-foreground/60'
                )}
              >
                <Icon className={cn(
                  'h-[22px] w-[22px] transition-all duration-200',
                  isActive && 'stroke-[2.2]'
                )} />
                <span className={cn(
                  'text-[10px] leading-tight mt-0.5 transition-all duration-200',
                  isActive ? 'font-semibold' : 'font-medium'
                )}>
                  {tab.label}
                </span>
                {/* Active indicator dot */}
                <div className={cn(
                  'h-[3px] w-[3px] rounded-full transition-all duration-300',
                  isActive ? 'bg-[hsl(var(--tenant-primary))] scale-100' : 'scale-0'
                )} />
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

/** Elevated center CTA button with grounding icon */
function CenterAction({ isActive, onTap }: { isActive: boolean; onTap: () => void }) {
  return (
    <div className="flex flex-col items-center -mt-4 px-1">
      <button
        onClick={onTap}
        className={cn(
          'w-[52px] h-[52px] rounded-2xl',
          'flex items-center justify-center',
          'bg-[hsl(var(--tenant-primary))] text-[hsl(var(--tenant-primary-foreground,0_0%_100%))]',
          'shadow-[0_4px_14px_-2px_hsl(var(--tenant-primary)/0.4)]',
          'transition-all duration-200',
          'active:scale-[0.92] active:shadow-[0_2px_8px_-2px_hsl(var(--tenant-primary)/0.3)]',
          'hover:shadow-[0_6px_18px_-2px_hsl(var(--tenant-primary)/0.5)]'
        )}
      >
        <GroundingIcon size={24} className="drop-shadow-sm" />
      </button>
      <span className={cn(
        'text-[10px] leading-tight mt-1.5 font-semibold transition-colors duration-200',
        isActive ? 'text-[hsl(var(--tenant-primary))]' : 'text-muted-foreground/60'
      )}>
        Meten
      </span>
    </div>
  );
}

/** Determine which tab is active based on current pathname */
function getActiveKey(pathname: string): string {
  if (pathname.startsWith('/planning')) return 'planning';
  if (pathname.startsWith('/meer') || pathname.startsWith('/settings')) return 'meer';
  if (pathname.startsWith('/projects')) return 'projecten';
  if (pathname === '/dashboard' || pathname === '/') return 'start';
  return 'start';
}
