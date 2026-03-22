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

  const MENU_SECTIONS = [
    {
      title: 'Account',
      items: [
        { label: 'Profiel', description: 'Persoonlijke gegevens', icon: User, iconStyle: 'ios-meer-icon-salmon', path: '/settings/profile' },
      ],
    },
    {
      title: 'Stamdata',
      items: [
        { label: 'Klanten', description: 'Opdrachtgevers beheren', icon: Users, iconStyle: 'ios-meer-icon-blue', path: '/clients' },
        { label: 'Monteurs', description: 'Technici en uitvoerders', icon: HardHat, iconStyle: 'ios-meer-icon-green', path: '/technicians' },
        { label: 'Apparatuur', description: 'Meetapparatuur en kalibratie', icon: Wrench, iconStyle: 'ios-meer-icon-orange', path: '/equipment' },
        { label: 'Rapporten', description: 'Gegenereerde rapporten', icon: FileText, iconStyle: 'ios-meer-icon-salmon', path: '/reports' },
      ],
    },
    {
      title: 'Beheer',
      items: [
        { label: 'Huisstijl', description: 'Logo, kleuren & rapport', icon: Palette, iconStyle: 'ios-meer-icon-blue', path: '/settings/branding' },
        { label: 'Bedrijfsgegevens', description: 'Naam, status & info', icon: Building2, iconStyle: 'ios-meer-icon-purple', path: '/settings/tenant' },
      ],
    },
  ];

  if (isMobile) {
    return (
      <div className="ios-meer-page animate-fade-in">
        {/* Profile card */}
        <div className="ios-meer-profile-card">
          <div className="ios-meer-avatar">
            {logoUrl ? (
              <img src={logoUrl} alt="" className="h-7 w-7 object-contain" />
            ) : (
              <span className="text-[18px] font-bold" style={{ color: 'hsl(var(--tenant-primary) / 0.6)' }}>
                {(profile?.full_name || '?')[0].toUpperCase()}
              </span>
            )}
          </div>
          <div className="ios-meer-profile-info">
            <p className="ios-meer-profile-name">{profile?.full_name || 'Gebruiker'}</p>
            <p className="ios-meer-profile-company">{tenant?.company_name || ''}</p>
          </div>
          <button
            onClick={() => navigate('/settings/profile')}
            className="ios-meer-profile-edit"
          >
            Bewerk
          </button>
        </div>

        {/* Menu sections */}
        {MENU_SECTIONS.map(section => (
          <div key={section.title} className="ios-meer-section">
            <p className="ios-meer-section-title">{section.title}</p>
            <div className="ios-meer-card">
              {section.items.map((item, i) => (
                <div key={item.label}>
                  <button
                    onClick={() => navigate(item.path)}
                    className="ios-meer-row"
                  >
                    <div className={cn('ios-meer-icon', item.iconStyle)}>
                      <item.icon className="h-4 w-4" />
                    </div>
                    <div className="ios-meer-row-text">
                      <p className="ios-meer-row-title">{item.label}</p>
                      <p className="ios-meer-row-sub">{item.description}</p>
                    </div>
                    <ChevronRight className="h-4 w-4" style={{ color: 'hsl(var(--muted-foreground) / 0.25)' }} />
                  </button>
                  {i < section.items.length - 1 && <div className="ios-meer-divider" />}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Weergave */}
        <div className="ios-meer-section">
          <p className="ios-meer-section-title">Weergave</p>
          <div className="ios-meer-card">
            <div className="flex items-center gap-2 px-4 py-3">
              {([
                { key: 'light' as const, label: 'Licht', Icon: Sun },
                { key: 'dark' as const, label: 'Donker', Icon: Moon },
                { key: 'system' as const, label: 'Systeem', Icon: Monitor },
              ]).map(({ key, label, Icon }) => (
                <button
                  key={key}
                  onClick={() => setThemeState(key)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[12px] font-semibold transition-all active:scale-[0.96]',
                    theme === key
                      ? 'bg-[hsl(var(--tenant-primary,var(--primary))/0.12)] text-[hsl(var(--tenant-primary,var(--primary)))]'
                      : 'text-muted-foreground/50'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Meldingen */}
        <div className="ios-meer-section">
          <p className="ios-meer-section-title">Meldingen</p>
          <div className="ios-meer-card">
            {!toegestaan ? (
              <button onClick={vraagToestemming} className="ios-meer-row">
                <div className={cn('ios-meer-icon', 'ios-meer-icon-orange')}>
                  <Bell className="h-4 w-4" />
                </div>
                <div className="ios-meer-row-text">
                  <p className="ios-meer-row-title">Meldingen inschakelen</p>
                  <p className="ios-meer-row-sub">Ontvang herinneringen voor geplande projecten</p>
                </div>
                <ChevronRight className="h-4 w-4" style={{ color: 'hsl(var(--muted-foreground) / 0.25)' }} />
              </button>
            ) : (
              <div className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <p className="text-[14px] font-medium text-foreground">Projectherinneringen</p>
                  <span className="text-[11px] font-semibold text-green-600 bg-green-500/10 px-2 py-0.5 rounded-full">Aan</span>
                </div>
                <p className="text-[11px] text-muted-foreground/40 mt-0.5">Je ontvangt herinneringen voor geplande projecten</p>
              </div>
            )}
          </div>
        </div>

        {/* Logout */}
        <div className="ios-meer-card" style={{ marginTop: 8 }}>
          <button onClick={handleLogout} className="ios-meer-logout-row">
            <LogOut className="h-4 w-4" style={{ color: 'hsl(var(--destructive))' }} />
            <span className="ios-meer-logout-label">Uitloggen</span>
          </button>
        </div>

        <p className="ios-meer-version">{tenant?.company_name} · v0.0.0</p>
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
