import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';
import { User, Settings, LogOut, Search, Bell, Clock } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

export function AppHeader() {
  const { user, profile, signOut } = useAuth();
  const { tenant } = useTenant();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  if (isMobile) return null;

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || '?';

  const rolLabel = 'Beheerder';

  return (
    <header className="h-16 border-b border-border/40 bg-background/85 backdrop-blur-xl flex items-center justify-between px-6 shrink-0">
      {/* Search */}
      <div className="flex items-center gap-2 bg-card border border-border rounded px-3 py-2 max-w-md w-full">
        <Search className="h-4 w-4 text-muted-foreground/50" />
        <input
          type="text"
          placeholder="Zoek project, klant of locatie..."
          className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 outline-none flex-1"
        />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        <button className="w-9 h-9 rounded flex items-center justify-center hover:bg-card transition-colors">
          <Bell className="h-[18px] w-[18px] text-muted-foreground/60" />
        </button>
        <button className="w-9 h-9 rounded flex items-center justify-center hover:bg-card transition-colors">
          <Clock className="h-[18px] w-[18px] text-muted-foreground/60" />
        </button>

        <div className="w-px h-8 bg-border mx-1" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 rounded px-2 py-1.5 hover:bg-card transition-colors">
              <div className="text-right hidden sm:block">
                <p className="text-[13px] font-semibold text-foreground leading-tight">
                  {profile?.full_name || 'Gebruiker'}
                </p>
                <p className="text-[11px] text-muted-foreground/50">{rolLabel}</p>
              </div>
              <Avatar className="h-9 w-9 border-2 border-[hsl(var(--primary))]">
                <AvatarFallback className="bg-muted text-foreground text-[11px] font-bold">
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
