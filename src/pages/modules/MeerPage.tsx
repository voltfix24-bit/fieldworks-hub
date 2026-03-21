import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { User, Settings, Building2, Palette, HelpCircle, LogOut, ChevronRight, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

const MENU_SECTIONS = [
  {
    title: 'Account',
    items: [
      { label: 'Profiel', description: 'Persoonlijke gegevens', icon: User, path: '/settings/profile' },
    ],
  },
  {
    title: 'Beheer',
    items: [
      { label: 'Huisstijl', description: 'Logo, kleuren & rapport', icon: Palette, path: '/settings/branding' },
      { label: 'Bedrijfsgegevens', description: 'Naam, status & info', icon: Building2, path: '/settings/tenant' },
      { label: 'Alle instellingen', description: 'Overzicht configuratie', icon: Settings, path: '/settings' },
    ],
  },
];

export default function MeerPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { tenant, branding } = useTenant();
  const logoUrl = branding?.compact_logo_url || branding?.logo_url;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="animate-fade-in">
      {/* Profile header */}
      <div className="rounded-2xl border border-border/40 bg-card p-4 mb-5 flex items-center gap-3.5">
        <div className="w-12 h-12 rounded-full bg-[hsl(var(--tenant-primary,var(--primary))/0.08)] flex items-center justify-center shrink-0">
          {logoUrl ? (
            <img src={logoUrl} alt="" className="h-6 w-6 object-contain" />
          ) : (
            <span className="text-[16px] font-bold text-[hsl(var(--tenant-primary,var(--primary))/0.6)]">
              {(profile?.full_name || '?')[0].toUpperCase()}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-bold text-foreground truncate">{profile?.full_name || 'Gebruiker'}</p>
          <p className="text-[12px] text-muted-foreground/50 truncate">{tenant?.company_name || ''}</p>
        </div>
        <button
          onClick={() => navigate('/settings/profile')}
          className="text-[11px] font-semibold text-[hsl(var(--tenant-primary,var(--primary))/0.6)] px-2.5 py-1 rounded-lg bg-[hsl(var(--tenant-primary,var(--primary))/0.06)] active:scale-95 transition-all"
        >
          Bewerk
        </button>
      </div>

      {/* Menu sections */}
      {MENU_SECTIONS.map(section => (
        <div key={section.title} className="mb-4">
          <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/40 px-1 mb-1.5">
            {section.title}
          </p>
          <div className="rounded-xl border border-border/40 bg-card overflow-hidden divide-y divide-border/30">
            {section.items.map(item => (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className="w-full flex items-center gap-3.5 px-4 py-3 hover:bg-muted/15 transition-colors text-left active:bg-muted/25"
              >
                <div className="w-8 h-8 rounded-lg bg-[hsl(var(--tenant-primary,var(--primary))/0.06)] flex items-center justify-center shrink-0">
                  <item.icon className="h-[16px] w-[16px] text-[hsl(var(--tenant-primary,var(--primary))/0.5)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-foreground">{item.label}</p>
                  <p className="text-[10px] text-muted-foreground/40 mt-0.5">{item.description}</p>
                </div>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/20" />
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Logout */}
      <button
        onClick={handleLogout}
        className={cn(
          'w-full flex items-center gap-3.5 px-4 py-3',
          'rounded-xl border border-destructive/10 bg-destructive/[0.02]',
          'hover:bg-destructive/5 transition-colors text-left active:bg-destructive/10'
        )}
      >
        <div className="w-8 h-8 rounded-lg bg-destructive/6 flex items-center justify-center shrink-0">
          <LogOut className="h-[16px] w-[16px] text-destructive/50" />
        </div>
        <span className="text-[13px] font-medium text-destructive/70">Uitloggen</span>
      </button>

      {/* Version */}
      <p className="text-center text-[10px] text-muted-foreground/25 mt-6 mb-2">
        {tenant?.company_name} · v1.0
      </p>
    </div>
  );
}
