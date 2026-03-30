import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';
import { User, Settings, LogOut, Bell, Clock, Sun, Moon } from 'lucide-react';
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
    <header className="h-16 border-b border-border/12 bg-card/60 backdrop-blur-2xl flex items-center px-8 shrink-0 shadow-[0_1px_2px_hsl(var(--foreground)/0.02)]">
      {/* Spacer */}
      <div className="flex-1" />

      {/* Actions cluster */}
      <div className="flex items-center gap-1">
        <HeaderIconButton icon={Bell} title="Notificaties" />
        <HeaderIconButton
          icon={theme === 'light' ? Moon : Sun}
          title={theme === 'light' ? 'Donkere modus' : 'Lichte modus'}
          onClick={toggleTheme}
        />
        <HeaderIconButton icon={Clock} title="Recente activiteit" />

        <div className="w-px h-6 bg-border/10 mx-3" />

        {/* Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 rounded-xl px-2.5 py-1.5 hover:bg-muted/20 transition-all duration-200 group">
              <div className="text-right hidden sm:block">
                <p className="text-[12px] font-semibold text-foreground leading-tight group-hover:text-foreground/90 transition-colors">
                  {profile?.full_name || 'Gebruiker'}
                </p>
                <p className="text-[10px] text-muted-foreground/25 font-medium mt-0.5">Beheerder</p>
              </div>
              <Avatar className="h-8 w-8 ring-2 ring-border/10 ring-offset-2 ring-offset-background shadow-sm">
                <AvatarFallback className="bg-[hsl(215_50%_12%)] text-white text-[10px] font-bold tracking-wider">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-lg border-border/15">
            <DropdownMenuLabel className="pb-2">
              <p className="font-semibold text-[13px]">{profile?.full_name || user?.email}</p>
              <p className="text-[11px] text-muted-foreground/40 font-normal mt-0.5">{user?.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/settings/profile')} className="py-2.5 rounded-lg">
              <User className="mr-2.5 h-4 w-4 text-muted-foreground/50" /> Profiel
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/settings')} className="py-2.5 rounded-lg">
              <Settings className="mr-2.5 h-4 w-4 text-muted-foreground/50" /> Instellingen
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut} className="py-2.5 rounded-lg">
              <LogOut className="mr-2.5 h-4 w-4 text-muted-foreground/50" /> Uitloggen
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
      className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground/30 hover:text-muted-foreground/55 hover:bg-muted/15 transition-all duration-200"
    >
      <Icon className="h-[16px] w-[16px]" />
    </button>
  );
}
