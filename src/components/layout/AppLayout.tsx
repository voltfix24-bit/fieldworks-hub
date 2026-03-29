import { Outlet, useLocation } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';
import { MobileTabBar } from './MobileTabBar';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTenant } from '@/contexts/TenantContext';

const FULLSCREEN_PATTERNS = [
  /\/projects\/[^/]+\/measurements/,
  /\/projects\/[^/]+\/report/,
];

export function AppLayout() {
  const isMobile = useIsMobile();
  const location = useLocation();
  const isFullscreen = FULLSCREEN_PATTERNS.some(p => p.test(location.pathname));

  return (
    <div className="min-h-screen flex w-full bg-background">
      <AppSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader />
        {isMobile && !isFullscreen && <MobileBrandBar />}

        <main className={`flex-1 overflow-auto ${
          isMobile
            ? isFullscreen ? 'p-0' : 'px-4 pt-1 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))]'
            : 'p-6 lg:p-8'
        }`}>
          <Outlet />
        </main>
      </div>

      <MobileTabBar />
    </div>
  );
}

/** Minimal logo-only brand bar */
function MobileBrandBar() {
  const { tenant, branding } = useTenant();
  const logoUrl = branding?.compact_logo_url || branding?.logo_url;

  return (
    <div className="flex items-center justify-center px-4 py-2.5 shrink-0">
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={tenant?.company_name || 'Logo'}
          className="h-8 w-auto max-w-[150px] object-contain"
        />
      ) : (
        <div className="h-8 w-8 rounded-xl bg-[hsl(var(--tenant-primary)/0.08)] flex items-center justify-center">
          <span className="text-[14px] font-bold text-[hsl(var(--tenant-primary))]">
            {(tenant?.company_name || '?')[0].toUpperCase()}
          </span>
        </div>
      )}
    </div>
  );
}
