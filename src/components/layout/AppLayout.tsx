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

/** Premium mobile brand header — logo only */
function MobileContextBar() {
  const { tenant, branding } = useTenant();
  const logoUrl = branding?.compact_logo_url || branding?.logo_url;

  return (
    <div className="flex items-center justify-center px-4 py-3 bg-background shrink-0">
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={tenant?.company_name || 'Logo'}
          className="h-8 w-auto max-w-[160px] object-contain"
        />
      ) : (
        <div className="h-10 w-10 rounded-xl bg-[hsl(var(--tenant-primary,var(--primary))/0.1)] flex items-center justify-center">
          <span className="text-lg font-semibold text-[hsl(var(--tenant-primary,var(--primary)))]">
            {(tenant?.company_name || '?')[0].toUpperCase()}
          </span>
        </div>
      )}
    </div>
  );
}
