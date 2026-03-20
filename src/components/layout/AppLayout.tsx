import { Outlet, useLocation } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';
import { MobileTabBar } from './MobileTabBar';
import { useIsMobile } from '@/hooks/use-mobile';

/** Routes where the full-screen measurement flow is active */
const FULLSCREEN_PATTERNS = [
  /\/projects\/[^/]+\/measurements/,
  /\/projects\/[^/]+\/report/,
];

export function AppLayout() {
  const isMobile = useIsMobile();
  const location = useLocation();
  const isFullscreen = FULLSCREEN_PATTERNS.some(p => p.test(location.pathname));

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        {/* Sidebar only on desktop */}
        {!isMobile && <AppSidebar />}

        <div className="flex-1 flex flex-col min-w-0">
          {/* Header: full on desktop, minimal context bar on mobile */}
          {!isMobile && <AppHeader />}
          {isMobile && !isFullscreen && <MobileContextBar />}

          <main className={`flex-1 overflow-auto ${
            isMobile 
              ? isFullscreen ? 'p-0' : 'px-4 pt-2 pb-24' 
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

/** Slim mobile top bar — just tenant name, no hamburger */
function MobileContextBar() {
  return (
    <div className="h-11 flex items-center px-4 border-b border-border/50 bg-background shrink-0">
      <span className="text-xs font-medium text-muted-foreground tracking-wide uppercase">
        {/* Tenant name injected via CSS var or context if needed — keeps it light */}
      </span>
    </div>
  );
}
