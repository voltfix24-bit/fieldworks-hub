import { useAuth } from '@/contexts/AuthContext';
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
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { theme, toggleTheme } = useTheme();

  if (isMobile) return null;

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || '?';

  return (
    <header className="h-14 border-b border-border/20 bg-card/40 backdrop-blur-xl flex items-center px-7 shrink-0 gap-6">
      {/* Spacer */}
      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center">
        <HeaderIconButton icon={Bell} title="Notificaties" />
        <HeaderIconButton
          icon={theme === 'light' ? Moon : Sun}
          title={theme === 'light' ? 'Donkere modus' : 'Lichte modus'}
          onClick={toggleTheme}
        />
        <HeaderIconButton icon={Clock} title="Recente activiteit" />

        <div className="w-px h-5 bg-border/15 mx-3" />

        {/* Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2.5 rounded-xl px-2 py-1 hover:bg-muted/25 transition-colors">
              <div className="text-right hidden sm:block">
                <p className="text-[12px] font-semibold text-foreground leading-tight">
                  {profile?.full_name || 'Gebruiker'}
                </p>
                <p className="text-[10px] text-muted-foreground/30 font-medium">Beheerder</p>
              </div>
              <Avatar className="h-[30px] w-[30px] ring-[1.5px] ring-border/25 ring-offset-1 ring-offset-background">
                <AvatarFallback className="bg-sidebar text-white text-[10px] font-bold tracking-wider">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>
              <p className="font-medium text-[13px]">{profile?.full_name || user?.email}</p>
              <p className="text-[11px] text-muted-foreground/45 font-normal">{user?.email}</p>
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

function HeaderIconButton({ icon: Icon, title, onClick }: { icon: any; title: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground/35 hover:text-muted-foreground/60 hover:bg-muted/30 transition-all duration-150"
    >
      <Icon className="h-[15px] w-[15px]" />
    </button>
  );
}
