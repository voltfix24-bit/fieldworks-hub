import { Outlet, useLocation } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';
import { MobileTabBar } from './MobileTabBar';
import { useIsMobile } from '@/hooks/use-mobile';

/** Routes where the full-screen measurement flow is active (no tab bar padding needed) */
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
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <AppHeader />
          <main className={`flex-1 p-4 sm:p-6 lg:p-8 overflow-auto ${isMobile && !isFullscreen ? 'pb-24' : ''}`}>
            <Outlet />
          </main>
        </div>
      </div>
      <MobileTabBar />
    </SidebarProvider>
  );
}
