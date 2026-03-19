import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { User, Settings, Building2, HelpCircle, LogOut, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

const MENU_ITEMS = [
  { label: 'Profiel', icon: User, path: '/settings/profile' },
  { label: 'Instellingen', icon: Settings, path: '/settings' },
  { label: 'Bedrijfsgegevens', icon: Building2, path: '/settings/tenant' },
  { label: 'Hulp', icon: HelpCircle, path: null },
];

export default function MeerPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { tenant } = useTenant();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="animate-fade-in">
      <PageHeader title="Meer" description="Profiel, instellingen en hulp" />

      {/* Profile card */}
      <div className="rounded-xl border border-border/40 bg-card p-4 mb-6 flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-full bg-primary/8 flex items-center justify-center shrink-0">
          <User className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-[14px] font-semibold text-foreground truncate">{profile?.full_name || 'Gebruiker'}</p>
          <p className="text-[12px] text-muted-foreground truncate">{tenant?.company_name || ''}</p>
        </div>
      </div>

      {/* Menu items */}
      <div className="rounded-xl border border-border/40 bg-card overflow-hidden divide-y divide-border/30">
        {MENU_ITEMS.map(item => (
          <button
            key={item.label}
            onClick={() => item.path && navigate(item.path)}
            className="w-full flex items-center gap-3.5 px-4 py-3.5 hover:bg-muted/15 transition-colors text-left active:bg-muted/25"
          >
            <item.icon className="h-[18px] w-[18px] text-muted-foreground/70 shrink-0" />
            <span className="flex-1 text-[13px] font-medium text-foreground">{item.label}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground/30" />
          </button>
        ))}
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className={cn(
          'mt-4 w-full flex items-center gap-3.5 px-4 py-3.5',
          'rounded-xl border border-destructive/15 bg-destructive/5',
          'hover:bg-destructive/10 transition-colors text-left active:bg-destructive/15'
        )}
      >
        <LogOut className="h-[18px] w-[18px] text-destructive/70 shrink-0" />
        <span className="text-[13px] font-medium text-destructive">Uitloggen</span>
      </button>
    </div>
  );
}
