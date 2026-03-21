import { Outlet, useLocation } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';
import { MobileTabBar } from './MobileTabBar';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTenant } from '@/contexts/TenantContext';

/** Routes where the full-screen measurement flow is active */
const FULLSCREEN_PATTERNS = [
  /\/projects\/[^/]+\/measurements/,
  /\/projects\/[^/]+\/report/,
];

export function AppLayout() {
  const isMobile = useIsMobile();
  const location = useLocation();
  const isFullscreen = FULLSCREEN_PATTERNS.some(p => p.test(location.pathname));
  const showTabBar = isMobile && !isFullscreen;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        {!isMobile && <AppSidebar />}

        <div className="flex-1 flex flex-col min-w-0">
          {!isMobile && <AppHeader />}
          {showTabBar && <MobileContextBar />}

          <main className={`flex-1 overflow-auto ${
            isMobile 
              ? isFullscreen ? 'p-0' : 'px-4 pt-2 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))]' 
              : 'p-4 sm:p-6 lg:p-8'
          }`}>
            <Outlet />
          </main>
        </div>
      </div>
      <MobileTabBar />
    </SidebarProvider>
  );
}

/** Slim mobile top bar with tenant logo + name */
function MobileContextBar() {
  const { tenant, branding } = useTenant();
  const logoUrl = branding?.compact_logo_url || branding?.logo_url;

  return (
    <div className="h-11 flex items-center gap-2.5 px-4 border-b border-border/50 bg-background shrink-0">
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={tenant?.company_name || 'Logo'}
          className="h-5 w-auto max-w-[28px] object-contain shrink-0"
        />
      ) : (
        <div className="h-5 w-5 rounded bg-[hsl(var(--tenant-primary,var(--primary))/0.12)] flex items-center justify-center shrink-0">
          <span className="text-[10px] font-bold text-[hsl(var(--tenant-primary,var(--primary)))]">
            {(tenant?.company_name || '?')[0].toUpperCase()}
          </span>
        </div>
      )}
      <span className="text-[12px] font-semibold text-foreground truncate">
        {tenant?.company_name || ''}
      </span>
    </div>
  );
}
