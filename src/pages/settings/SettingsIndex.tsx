import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { useTechnicians } from '@/hooks/use-technicians';
import { useEquipmentList } from '@/hooks/use-equipment';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { Palette, User, Building2, ChevronRight, CheckCircle2, AlertCircle, Users, HardHat, Wrench, FileText, Settings, LogOut, Sun, Moon, Monitor, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

export default function SettingsIndex() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { profile } = useAuth();
  const { tenant, branding } = useTenant();
  const { data: technicians } = useTechnicians();
  const { data: equipment } = useEquipmentList();
  const logoUrl = branding?.compact_logo_url || branding?.logo_url;
  const { toegestaan, vraagToestemming } = usePushNotifications();
  const [theme, setThemeState] = useState<'light' | 'dark' | 'system'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark' | 'system') || 'system';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const hasLogo = !!(branding?.logo_url || branding?.compact_logo_url);
  const hasKvk = !!branding?.kvk_number;
  const activeTechs = technicians?.filter(t => t.is_active).length ?? 0;
  const calWarnings = equipment?.filter(e => {
    if (!e.next_calibration_date) return false;
    return new Date(e.next_calibration_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }).length ?? 0;

  const sections = [
    {
      title: 'Huisstijl',
      description: 'Logo, kleuren en rapport-opmaak',
      icon: Palette,
      path: '/settings/branding',
      color: 'var(--tenant-primary,var(--primary))',
      status: hasLogo ? 'Logo ingesteld' : 'Geen logo',
      statusOk: hasLogo,
    },
    {
      title: 'Gebruikersprofiel',
      description: 'Persoonlijke gegevens beheren',
      icon: User,
      path: '/settings/profile',
      color: 'var(--tenant-accent,var(--accent))',
    },
    {
      title: 'Bedrijfsoverzicht',
      description: 'Bedrijfsgegevens en status',
      icon: Building2,
      path: '/settings/tenant',
      color: 'var(--tenant-secondary,var(--secondary))',
      status: hasKvk ? 'KvK ingevuld' : 'KvK ontbreekt',
      statusOk: hasKvk,
    },
  ];

  const statusItems = [
    { label: 'Actieve monteurs', value: String(activeTechs), ok: activeTechs > 0 },
    ...(calWarnings > 0 ? [{ label: 'Kalibratie', value: `${calWarnings} waarschuwing${calWarnings !== 1 ? 'en' : ''}`, ok: false }] : []),
  ];

  if (isMobile) {
    return (
      <div className="animate-fade-in">
        <PageHeader title="Instellingen" description="Account en bedrijfsinstellingen" />
        <div className="rounded-xl border border-border/40 bg-card overflow-hidden divide-y divide-border/30">
          {sections.map(s => (
            <button
              key={s.path}
              onClick={() => navigate(s.path)}
              className="w-full flex items-center gap-3.5 px-4 py-3.5 hover:bg-muted/15 transition-colors text-left active:bg-muted/25"
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: `hsl(${s.color} / 0.08)` }}
              >
                <s.icon className="h-[18px] w-[18px]" style={{ color: `hsl(${s.color} / 0.6)` }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-foreground">{s.title}</p>
                <p className="text-[11px] text-muted-foreground/50 mt-0.5">{s.description}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {s.status && (
                  <span className={cn(
                    'text-[10px] font-medium',
                    s.statusOk ? 'text-[hsl(var(--status-completed))]' : 'text-muted-foreground/40'
                  )}>
                    {s.statusOk ? '✓' : '✗'}
                  </span>
                )}
                <ChevronRight className="h-4 w-4 text-muted-foreground/25" />
              </div>
            </button>
          ))}
        </div>

        {statusItems.length > 0 && (
          <div className="mt-4 rounded-xl border border-border/40 bg-card overflow-hidden divide-y divide-border/30">
            {statusItems.map(item => (
              <div key={item.label} className="flex items-center justify-between px-4 py-3">
                <span className="text-[13px] text-foreground">{item.label}</span>
                <span className={cn(
                  'text-[12px] font-medium',
                  item.ok ? 'text-[hsl(var(--status-completed))]' : 'text-amber-500'
                )}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <PageHeader title="Instellingen" description="Beheer uw account- en bedrijfsinstellingen" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map(s => (
          <button
            key={s.path}
            onClick={() => navigate(s.path)}
            className="text-left rounded-xl border border-border/40 bg-card hover:border-[hsl(var(--tenant-primary,var(--primary))/0.2)] hover:shadow-sm transition-all p-5 group"
          >
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center mb-3"
              style={{ backgroundColor: `hsl(${s.color} / 0.08)` }}
            >
              <s.icon className="h-5 w-5" style={{ color: `hsl(${s.color} / 0.6)` }} />
            </div>
            <p className="text-[14px] font-semibold text-foreground">{s.title}</p>
            <p className="text-[12px] text-muted-foreground/60 mt-1">{s.description}</p>
            {s.status && (
              <div className="flex items-center gap-1.5 mt-2">
                {s.statusOk ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-[hsl(var(--status-completed))]" />
                ) : (
                  <AlertCircle className="h-3.5 w-3.5 text-muted-foreground/30" />
                )}
                <span className={cn(
                  'text-[11px]',
                  s.statusOk ? 'text-[hsl(var(--status-completed))]' : 'text-muted-foreground/40'
                )}>
                  {s.status}
                </span>
              </div>
            )}
          </button>
        ))}
      </div>

      {statusItems.length > 0 && (
        <div className="mt-6 rounded-xl border border-border/40 bg-card p-4">
          <h3 className="text-[13px] font-semibold text-foreground mb-3">Status overzicht</h3>
          <div className="space-y-2">
            {statusItems.map(item => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-[13px] text-muted-foreground/60">{item.label}</span>
                <span className={cn(
                  'text-[13px] font-medium',
                  item.ok ? 'text-[hsl(var(--status-completed))]' : 'text-amber-500'
                )}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
