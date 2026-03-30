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
    <header className="h-[56px] border-b border-border/25 bg-card/50 backdrop-blur-xl flex items-center justify-between px-7 shrink-0">
      {/* Search */}
      <div className="flex items-center gap-2.5 bg-background/60 border border-border/30 rounded-xl px-4 py-[7px] max-w-md w-full transition-all duration-200 focus-within:border-primary/30 focus-within:bg-card focus-within:shadow-[0_0_0_3px_hsl(var(--primary)/0.06)]">
        <Search className="h-[15px] w-[15px] text-muted-foreground/35" />
        <input
          type="text"
          placeholder="Zoek project, klant of locatie..."
          className="bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground/30 outline-none flex-1"
        />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-1">
        {[
          { icon: Bell, onClick: undefined, title: 'Notificaties' },
          { icon: theme === 'light' ? Moon : Sun, onClick: toggleTheme, title: theme === 'light' ? 'Donkere modus' : 'Lichte modus' },
          { icon: Clock, onClick: undefined, title: 'Recente activiteit' },
        ].map(({ icon: Icon, onClick, title }) => (
          <button
            key={title}
            onClick={onClick}
            title={title}
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-muted/40 transition-all duration-150 group"
          >
            <Icon className="h-[16px] w-[16px] text-muted-foreground/40 group-hover:text-muted-foreground/70 transition-colors" />
          </button>
        ))}

        <div className="w-px h-7 bg-border/20 mx-2.5" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 rounded-xl px-2.5 py-1.5 hover:bg-muted/30 transition-all duration-150">
              <div className="text-right hidden sm:block">
                <p className="text-[13px] font-semibold text-foreground leading-tight">
                  {profile?.full_name || 'Gebruiker'}
                </p>
                <p className="text-[10px] text-muted-foreground/35 font-medium">{rolLabel}</p>
              </div>
              <Avatar className="h-8 w-8 ring-2 ring-border/20 ring-offset-1 ring-offset-card">
                <AvatarFallback className="bg-sidebar text-white text-[10px] font-bold tracking-wide">
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
