import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';
import { useProjects } from '@/hooks/use-projects';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatNlDate, formatNlDateCompact } from '@/lib/nl-date';
import {
  FolderKanban, CheckCircle2, Clock, MapPin,
  Calendar, ChevronRight, ArrowRight, AlertTriangle,
  Plus, FileText, Building2, Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { isToday, parseISO, isPast } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function Dashboard() {
  const { tenant } = useTenant();
  const { profile } = useAuth();
  const { data: projects } = useProjects();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { toast } = useToast();

  // Daily calibration check
  useEffect(() => {
    const KALIBRATIE_CHECK_KEY = 'aardpen_kalibratie_check_datum';
    const vandaag = new Date().toISOString().split('T')[0];
    if (localStorage.getItem(KALIBRATIE_CHECK_KEY) === vandaag) return;
    
    (async () => {
      try {
        const { data: apparaat } = await supabase
          .from('equipment')
          .select('*')
          .eq('is_active', true)
          .eq('is_default', true)
          .limit(1)
          .maybeSingle();
        
        if (apparaat?.next_calibration_date) {
          localStorage.setItem(KALIBRATIE_CHECK_KEY, vandaag);
          const verloopDatum = new Date(apparaat.next_calibration_date);
          const nu = new Date();
          const dagenOver = Math.ceil((verloopDatum.getTime() - nu.getTime()) / (1000 * 60 * 60 * 24));
          
          if (dagenOver < 0) {
            toast({
              title: '⚠️ Kalibratie verlopen',
              description: `${apparaat.device_name} is verlopen op ${verloopDatum.toLocaleDateString('nl-NL')}. Gebruik dit apparaat niet voor officiële metingen.`,
              variant: 'destructive',
              duration: 8000,
            });
          } else if (dagenOver <= 30) {
            toast({
              title: 'Kalibratie verloopt binnenkort',
              description: `${apparaat.device_name} verloopt over ${dagenOver} dagen. Plan een nieuwe kalibratie.`,
              duration: 5000,
            });
          }
        }
      } catch {}
    })();
  }, []);

  const planned = projects?.filter(p => p.status === 'planned') ?? [];
  const completed = projects?.filter(p => p.status === 'completed') ?? [];
  const todayProjects = planned.filter(p => {
    try { return p.planned_date && isToday(parseISO(p.planned_date)); } catch { return false; }
  });
  const overdueProjects = planned.filter(p => {
    try {
      if (!p.planned_date) return false;
      const d = parseISO(p.planned_date);
      return isPast(d) && !isToday(d);
    } catch { return false; }
  });

  const firstName = profile?.full_name?.split(' ')[0] || '';
  const greeting = getGreeting();

  if (!projects) {
    if (isMobile) {
      return (
        <div className="ios-dash animate-fade-in">
          <div className="ios-dash-greeting">
            <div className="h-7 w-48 rounded-lg bg-muted/30 animate-pulse" />
            <div className="h-4 w-32 rounded-lg bg-muted/20 animate-pulse mt-2" />
          </div>
          <div className="grid grid-cols-3 gap-2 px-4 mt-4">
            {[1,2,3].map(i => (
              <div key={i} className="rounded-2xl bg-card p-3 h-16 animate-pulse">
                <div className="h-3 w-8 rounded bg-muted/30 mb-2" />
                <div className="h-5 w-6 rounded bg-muted/20" />
              </div>
            ))}
          </div>
        </div>
      );
    }
    return (
      <div className="animate-fade-in space-y-6">
        <div className="h-8 w-64 rounded bg-muted/30 animate-pulse" />
        <div className="grid grid-cols-3 gap-5">
          {[1,2,3].map(i => (
            <div key={i} className="rounded bg-card p-5 h-28 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="ios-dash animate-fade-in">
        <div className="ios-dash-greeting">
          <h1 className="ios-dash-greeting-title">
            {greeting}{firstName ? `, ${firstName}` : ''}
          </h1>
          <p className="ios-dash-greeting-sub">
            {todayProjects.length > 0
              ? `${todayProjects.length} ${todayProjects.length === 1 ? 'project' : 'projecten'} vandaag`
              : 'Geen projecten vandaag gepland'}
          </p>
        </div>

        <div className="ios-dash-stats">
          <div className="ios-dash-stat-card">
            <span className="ios-dash-stat-dot ios-dot-orange" />
            <span className="ios-dash-stat-value">{planned.length}</span>
            <span className="ios-dash-stat-label">Gepland</span>
          </div>
          <div className="ios-dash-stat-card">
            <span className="ios-dash-stat-dot ios-dot-green" />
            <span className="ios-dash-stat-value ios-val-green">{completed.length}</span>
            <span className="ios-dash-stat-label">Afgerond</span>
          </div>
          {overdueProjects.length > 0 && (
            <div className="ios-dash-stat-card">
              <span className="ios-dash-stat-dot ios-dot-red" />
              <span className="ios-dash-stat-value ios-val-red">{overdueProjects.length}</span>
              <span className="ios-dash-stat-label">Achterstallig</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 px-4 mt-1">
          <button
            onClick={() => navigate('/projects/new')}
            className="flex items-center gap-2.5 rounded-2xl bg-card px-4 py-3.5 active:scale-[0.97] transition-all shadow-[0_1px_0_hsl(var(--foreground)/0.04)]"
          >
            <div className="w-8 h-8 rounded-xl bg-[hsl(var(--tenant-primary)/0.1)] flex items-center justify-center shrink-0">
              <Plus className="h-4 w-4 text-[hsl(var(--tenant-primary))]" />
            </div>
            <div className="text-left">
              <p className="text-[13px] font-semibold text-foreground">Nieuw project</p>
              <p className="text-[10px] text-muted-foreground/40">Aanmaken</p>
            </div>
          </button>
          <button
            onClick={() => navigate('/reports')}
            className="flex items-center gap-2.5 rounded-2xl bg-card px-4 py-3.5 active:scale-[0.97] transition-all shadow-[0_1px_0_hsl(var(--foreground)/0.04)]"
          >
            <div className="w-8 h-8 rounded-xl bg-[hsl(var(--tenant-primary)/0.1)] flex items-center justify-center shrink-0">
              <FileText className="h-4 w-4 text-[hsl(var(--tenant-primary))]" />
            </div>
            <div className="text-left">
              <p className="text-[13px] font-semibold text-foreground">Rapporten</p>
              <p className="text-[10px] text-muted-foreground/40">Bekijken</p>
            </div>
          </button>
        </div>

        {overdueProjects.length > 0 && (
          <button onClick={() => navigate('/planning?view=kalender')} className="ios-dash-alert">
            <div className="ios-dash-alert-left">
              <div className="ios-dash-alert-icon">
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </div>
              <div>
                <p className="ios-dash-alert-text">
                  {overdueProjects.length} {overdueProjects.length === 1 ? 'project' : 'projecten'} achterstallig
                </p>
                <p className="ios-dash-alert-sub">Actie vereist</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-destructive/30" />
          </button>
        )}

        {todayProjects.length > 0 ? (
          <section>
            <IosSectionHeader title="Vandaag" />
            <div className="ios-dash-card">
              {todayProjects.map((p, i) => (
                <div key={p.id}>
                  <DashProjectRow project={p} onClick={() => navigate(`/projects/${p.id}`)} />
                  {i < todayProjects.length - 1 && <div className="ios-dash-row-divider" />}
                </div>
              ))}
            </div>
          </section>
        ) : (
          <section>
            <IosSectionHeader title="Vandaag" />
            <div className="ios-dash-card px-4 py-4">
              <p className="text-[14px] text-muted-foreground/40 text-center">
                Geen projecten gepland vandaag
              </p>
            </div>
          </section>
        )}

        <section>
          <IosSectionHeader
            title="Recente projecten"
            action={projects && projects.length > 6 ? () => navigate('/projects') : undefined}
            actionLabel="Alles →"
          />
          {projects && projects.length > 0 ? (
            <div className="ios-dash-card">
              {projects.slice(0, 6).map((p, i) => (
                <div key={p.id}>
                  <DashProjectRow project={p} onClick={() => navigate(`/projects/${p.id}`)} showDate />
                  {i < Math.min(projects.length, 6) - 1 && <div className="ios-dash-row-divider" />}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-14">
              <FolderKanban className="h-6 w-6 text-muted-foreground/12 mx-auto mb-2" />
              <p className="ios-dash-empty">Nog geen projecten</p>
            </div>
          )}
        </section>
      </div>
    );
  }

  // ── Desktop layout ──
  const recentProjects = projects?.slice(0, 10) ?? [];
  const actionRequired = overdueProjects.length;

  return (
    <div className="animate-fade-in max-w-[1100px]">
      {/* ── Hero strip ── */}
      <div className="relative bg-[hsl(215_50%_12%)] rounded-xl px-7 py-5 mb-5 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.12] via-transparent to-transparent" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-display text-[20px] font-black text-white tracking-[-0.01em] leading-none">
                  {greeting}, {firstName || 'Gebruiker'}
                </h1>
                {todayProjects.length > 0 && (
                  <span className="px-2 py-0.5 rounded bg-primary/25 text-primary text-[9px] font-bold uppercase tracking-[0.08em]">
                    {todayProjects.length} vandaag
                  </span>
                )}
              </div>
              <p className="text-[11px] text-white/35 font-medium mt-1.5">
                {planned.length} gepland · {completed.length} afgerond
                {actionRequired > 0 && <span className="text-red-400/80"> · {actionRequired} actie vereist</span>}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/projects/new')}
            className="flex items-center gap-2 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-[0.1em] px-5 py-2.5 rounded-lg hover:brightness-110 transition-all shadow-[0_2px_8px_hsl(var(--primary)/0.4)]"
          >
            <Plus className="h-3.5 w-3.5" /> Nieuw Project
          </button>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-3 gap-3.5 mb-5">
        <DeskStatCard
          label="Gepland"
          value={planned.length}
          icon={Calendar}
          accentClass="text-primary"
          accentBg="bg-primary/10"
          barClass="bg-primary"
          action={() => navigate('/planning?view=kalender')}
          actionLabel="Planning →"
        />
        <DeskStatCard
          label="Afgerond"
          value={completed.length}
          icon={CheckCircle2}
          accentClass="text-field-green"
          accentBg="bg-field-green/10"
          barClass="bg-field-green"
          valueClass="text-field-green"
          footnote="Totaal afgerond"
        />
        <DeskStatCard
          label="Actie Vereist"
          value={actionRequired}
          icon={AlertTriangle}
          accentClass="text-field-red"
          accentBg="bg-field-red/10"
          barClass="bg-field-red"
          valueClass="text-field-red"
          footnote={actionRequired > 0 ? 'Directe actie nodig' : 'Alles op schema'}
        />
      </div>

      {/* ── Overdue alert ── */}
      {overdueProjects.length > 0 && (
        <button
          onClick={() => navigate('/planning?view=kalender')}
          className="w-full flex items-center gap-3 bg-field-red/[0.06] border border-field-red/15 rounded-lg px-5 py-3 mb-5 hover:bg-field-red/[0.1] transition-all group text-left"
        >
          <div className="w-8 h-8 rounded-lg bg-field-red/12 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-3.5 w-3.5 text-field-red" />
          </div>
          <p className="flex-1 text-[12px] font-bold text-field-red">
            {overdueProjects.length} {overdueProjects.length === 1 ? 'project' : 'projecten'} achterstallig
            <span className="font-medium text-field-red/40 ml-2">— Bekijk planning</span>
          </p>
          <ArrowRight className="h-3.5 w-3.5 text-field-red/20 group-hover:text-field-red/50 group-hover:translate-x-0.5 transition-all shrink-0" />
        </button>
      )}

      {/* ── Two-column: Projects + Today sidebar ── */}
      <div className="grid grid-cols-[1fr_280px] gap-4">
        {/* Main: Recent projects */}
        <div className="bg-card rounded-xl border border-border/25 overflow-hidden shadow-[0_1px_4px_hsl(var(--foreground)/0.05)]">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/15 bg-muted/[0.04]">
            <div className="flex items-center gap-2.5">
              <FolderKanban className="h-4 w-4 text-muted-foreground/40" />
              <h3 className="text-[13px] font-bold text-foreground">Recente Projecten</h3>
              <span className="text-[10px] text-muted-foreground/25 font-medium ml-1">{projects?.length || 0}</span>
            </div>
            {projects && projects.length > 0 && (
              <button
                onClick={() => navigate('/projects')}
                className="text-[10px] font-bold text-primary/60 hover:text-primary transition-colors uppercase tracking-[0.1em] px-2.5 py-1 rounded hover:bg-primary/[0.05]"
              >
                Alles →
              </button>
            )}
          </div>

          {/* Column labels */}
          {recentProjects.length > 0 && (
            <div className="flex items-center px-5 py-1.5 border-b border-border/8">
              <div className="w-8 mr-3" />
              <span className="flex-1 text-[8px] font-extrabold uppercase tracking-[0.2em] text-muted-foreground/20">Project</span>
              <span className="w-24 text-[8px] font-extrabold uppercase tracking-[0.2em] text-muted-foreground/20 text-right hidden lg:block">Datum</span>
              <span className="w-20 text-[8px] font-extrabold uppercase tracking-[0.2em] text-muted-foreground/20 text-center">Status</span>
              <span className="w-4" />
            </div>
          )}

          {recentProjects.length > 0 ? (
            <div>
              {recentProjects.map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => navigate(`/projects/${p.id}`)}
                  className={cn(
                    'w-full flex items-center px-5 py-2.5 hover:bg-primary/[0.02] transition-all duration-100 text-left group',
                    i < recentProjects.length - 1 && 'border-b border-border/[0.07]',
                    i % 2 === 0 && 'bg-muted/[0.02]'
                  )}
                >
                  <div className="w-8 h-8 rounded-lg bg-muted/15 flex items-center justify-center shrink-0 mr-3 group-hover:bg-muted/30 transition-colors">
                    <ProjectIcon status={p.status} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-foreground truncate leading-tight">{p.project_name}</p>
                    <p className="text-[10px] text-muted-foreground/35 truncate mt-0.5">
                      {[p.project_number, p.city].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <span className="w-24 text-[10px] text-muted-foreground/40 text-right hidden lg:block font-medium shrink-0">
                    {p.planned_date ? formatNlDate(p.planned_date) : '—'}
                  </span>
                  <span className="w-20 flex justify-center shrink-0">
                    <ProjectStatusBadge project={p} />
                  </span>
                  <ChevronRight className="w-4 h-3.5 text-muted-foreground/10 group-hover:text-muted-foreground/30 transition-all shrink-0" />
                </button>
              ))}
            </div>
          ) : (
            <div className="px-5 py-14 text-center">
              <FolderKanban className="h-5 w-5 text-muted-foreground/10 mx-auto mb-2" />
              <p className="text-[11px] text-muted-foreground/25 font-medium">Nog geen projecten</p>
            </div>
          )}
        </div>

        {/* Sidebar: Today + Quick actions */}
        <div className="space-y-4">
          {/* Today's projects */}
          <div className="bg-card rounded-xl border border-border/25 overflow-hidden shadow-[0_1px_4px_hsl(var(--foreground)/0.05)]">
            <div className="px-4 py-3 border-b border-border/15 bg-muted/[0.04]">
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-primary/60" />
                <h3 className="text-[12px] font-bold text-foreground">Vandaag</h3>
                {todayProjects.length > 0 && (
                  <span className="ml-auto text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                    {todayProjects.length}
                  </span>
                )}
              </div>
            </div>
            {todayProjects.length > 0 ? (
              <div>
                {todayProjects.slice(0, 5).map((p, i) => (
                  <button
                    key={p.id}
                    onClick={() => navigate(`/projects/${p.id}`)}
                    className={cn(
                      'w-full px-4 py-2.5 text-left hover:bg-primary/[0.03] transition-colors group',
                      i < Math.min(todayProjects.length, 5) - 1 && 'border-b border-border/[0.06]'
                    )}
                  >
                    <p className="text-[11px] font-semibold text-foreground truncate group-hover:text-primary transition-colors">{p.project_name}</p>
                    <p className="text-[9px] text-muted-foreground/30 truncate mt-0.5">
                      {[p.project_number, p.city].filter(Boolean).join(' · ')}
                    </p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-4 py-6 text-center">
                <p className="text-[10px] text-muted-foreground/25 font-medium">Geen projecten vandaag</p>
              </div>
            )}
          </div>

          {/* Quick nav */}
          <div className="bg-card rounded-xl border border-border/25 overflow-hidden shadow-[0_1px_4px_hsl(var(--foreground)/0.05)]">
            <div className="px-4 py-3 border-b border-border/15 bg-muted/[0.04]">
              <h3 className="text-[12px] font-bold text-foreground">Snelle acties</h3>
            </div>
            <div className="p-2">
              {[
                { label: 'Nieuw project', icon: Plus, onClick: () => navigate('/projects/new') },
                { label: 'Rapporten', icon: FileText, onClick: () => navigate('/reports') },
                { label: 'Kaart', icon: MapPin, onClick: () => navigate('/map') },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-muted/[0.06] transition-colors group"
                >
                  <div className="w-7 h-7 rounded-md bg-muted/15 flex items-center justify-center shrink-0 group-hover:bg-primary/[0.08] transition-colors">
                    <item.icon className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                  </div>
                  <span className="text-[11px] font-semibold text-foreground/70 group-hover:text-foreground transition-colors">{item.label}</span>
                  <ChevronRight className="h-3 w-3 text-muted-foreground/10 ml-auto" />
                </button>
              ))}
            </div>
          </div>

          {/* Planned count */}
          <div className="bg-[hsl(215_50%_12%)] rounded-xl p-4 text-center">
            <p className="font-display text-[28px] font-black text-white leading-none">{planned.length}</p>
            <p className="text-[9px] text-white/30 font-bold uppercase tracking-[0.15em] mt-1.5">Actieve projecten</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Desktop Stat Card ── */
function DeskStatCard({ label, value, icon: Icon, accentClass, accentBg, barClass, valueClass, footnote, action, actionLabel }: {
  label: string; value: number; icon: any;
  accentClass: string; accentBg: string; barClass: string;
  valueClass?: string; footnote?: string;
  action?: () => void; actionLabel?: string;
}) {
  return (
    <div className="bg-card rounded-xl border border-border/25 p-4 relative overflow-hidden shadow-[0_1px_4px_hsl(var(--foreground)/0.05)] hover:shadow-[0_3px_12px_hsl(var(--foreground)/0.07)] hover:border-border/35 transition-all duration-200 group">
      <div className={`absolute top-0 left-0 w-full h-[2px] ${barClass} opacity-50 group-hover:opacity-100 transition-opacity`} />
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-muted-foreground/40">{label}</span>
        <div className={`w-8 h-8 rounded-md ${accentBg} flex items-center justify-center shrink-0`}>
          <Icon className={`h-[14px] w-[14px] ${accentClass}`} />
        </div>
      </div>
      <p className={`font-display text-[32px] font-black leading-none tracking-[-0.02em] ${valueClass || 'text-foreground'}`}>{value}</p>
      {action ? (
        <button onClick={(e) => { e.stopPropagation(); action(); }} className={`flex items-center gap-1 text-[9px] font-bold ${accentClass} hover:underline uppercase tracking-[0.08em] mt-2`}>
          {actionLabel} <ArrowRight className="h-2.5 w-2.5" />
        </button>
      ) : (
        <p className="text-[9px] text-muted-foreground/30 font-semibold tracking-wide mt-2">{footnote}</p>
      )}
    </div>
  );
}

/* ── Helpers ── */
function getGreeting() {
  const h = new Date().getHours();
  if (h < 6) return 'Goedenacht';
  if (h < 12) return 'Goedemorgen';
  if (h < 18) return 'Goedemiddag';
  return 'Goedenavond';
}

function ProjectIcon({ status }: { status: string }) {
  if (status === 'completed') return <CheckCircle2 className="h-4 w-4 text-field-green" />;
  return <Building2 className="h-4 w-4 text-muted-foreground/35" />;
}

function ProjectStatusBadge({ project }: { project: any }) {
  if (project.status === 'completed') {
    return <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-field-green-bg text-field-green uppercase tracking-[0.1em]">Voldoet</span>;
  }
  try {
    if (project.planned_date) {
      const d = parseISO(project.planned_date);
      if (isPast(d) && !isToday(d)) {
        return <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-field-red-bg text-field-red uppercase tracking-[0.1em]">Afwijking</span>;
      }
    }
  } catch {}
  return <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-primary/[0.08] text-primary uppercase tracking-[0.1em]">Gepland</span>;
}

function IosSectionHeader({ title, action, actionLabel }: { title: string; action?: () => void; actionLabel?: string }) {
  return (
    <div className="ios-dash-section-header">
      <span className="ios-dash-section-title">{title}</span>
      {action && (
        <button onClick={action} className="ios-dash-section-link">
          {actionLabel || 'Alles →'}
        </button>
      )}
    </div>
  );
}

function getDotClass(project: any): string {
  if (project.status === 'completed') return 'ios-pdot-green';
  if (!project.planned_date) return 'ios-pdot-grey';
  try {
    const d = parseISO(project.planned_date);
    if (isToday(d)) return 'ios-pdot-orange';
    if (isPast(d)) return 'ios-pdot-red';
  } catch {}
  return 'ios-pdot-grey';
}

function DashStatusDot({ project }: { project: any }) {
  return <span className={cn('ios-dash-project-dot', getDotClass(project))} />;
}

function DashProjectRow({ project: p, onClick, showDate }: {
  project: any; onClick: () => void; showDate?: boolean;
}) {
  return (
    <button onClick={onClick} className="ios-dash-project-row">
      <DashStatusDot project={p} />
      <div className="ios-dash-project-info">
        <p className="ios-dash-project-name">{p.project_name}</p>
        <div className="ios-dash-project-meta">
          <span>{p.project_number}</span>
          {p.city && (
            <>
              <span>·</span>
              <MapPin className="h-2.5 w-2.5" />
              <span>{p.city}</span>
            </>
          )}
        </div>
      </div>
      <div className="ios-dash-project-right">
        {showDate && p.planned_date && (
          <span className="ios-dash-project-date">{formatNlDateCompact(p.planned_date)}</span>
        )}
        <ChevronRight className="h-4 w-4 ios-dash-project-chevron" />
      </div>
    </button>
  );
}
