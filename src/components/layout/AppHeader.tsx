import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';
import { User, Settings, LogOut, Search, Bell, Clock, Sun, Moon } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTheme } from '@/hooks/use-theme';

export function AppHeader() {
  const { user, profile, signOut } = useAuth();
  const { tenant } = useTenant();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { theme, toggleTheme } = useTheme();

  if (isMobile) return null;

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || '?';

  const rolLabel = 'Beheerder';

  return (
    <header className="h-14 border-b border-border/30 bg-background/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0">
      {/* Search */}
      <div className="flex items-center gap-2.5 bg-card/60 border border-border/40 rounded-lg px-3.5 py-2 max-w-sm w-full transition-colors focus-within:border-border focus-within:bg-card">
        <Search className="h-4 w-4 text-muted-foreground/40" />
        <input
          type="text"
          placeholder="Zoek project, klant of locatie..."
          className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground/35 outline-none flex-1"
        />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-1.5">
        <button className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted/50 transition-colors">
          <Bell className="h-[17px] w-[17px] text-muted-foreground/50" />
        </button>
        <button onClick={toggleTheme} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted/50 transition-colors" title={theme === 'light' ? 'Donkere modus' : 'Lichte modus'}>
          {theme === 'light' ? <Moon className="h-[17px] w-[17px] text-muted-foreground/50" /> : <Sun className="h-[17px] w-[17px] text-muted-foreground/50" />}
        </button>
        <button className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted/50 transition-colors">
          <Clock className="h-[17px] w-[17px] text-muted-foreground/50" />
        </button>

        <div className="w-px h-6 bg-border/30 mx-2" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-muted/40 transition-colors">
              <div className="text-right hidden sm:block">
                <p className="text-[13px] font-semibold text-foreground leading-tight">
                  {profile?.full_name || 'Gebruiker'}
                </p>
                <p className="text-[11px] text-muted-foreground/40">{rolLabel}</p>
              </div>
              <Avatar className="h-8 w-8 border border-border/50">
                <AvatarFallback className="bg-sidebar text-white text-[11px] font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <p className="font-medium">{profile?.full_name || user?.email}</p>
              <p className="text-xs text-muted-foreground/50 font-normal">{user?.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/settings/profile')}>
              <User className="mr-2 h-4 w-4" /> Profiel
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <Settings className="mr-2 h-4 w-4" /> Instellingen
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" /> Uitloggen
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
