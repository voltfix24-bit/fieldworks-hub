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

  // ── Desktop layout — Premium Field Ops ──
  const recentProjects = projects?.slice(0, 8) ?? [];
  const actionRequired = overdueProjects.length;

  return (
    <div className="animate-fade-in max-w-[1100px]">
      {/* Greeting */}
      <div className="mb-10">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[12px] text-muted-foreground/50 font-medium uppercase tracking-[0.15em] mb-2">
              {greeting}
            </p>
            <h1 className="font-display text-[26px] font-black text-foreground tracking-tight leading-none">
              {profile?.full_name || 'Gebruiker'}
            </h1>
            <p className="text-[13px] text-muted-foreground/40 mt-2 font-normal">
              {todayProjects.length > 0
                ? `${todayProjects.length} ${todayProjects.length === 1 ? 'project' : 'projecten'} vandaag gepland`
                : 'Geen projecten vandaag gepland'}
            </p>
          </div>
          <button
            onClick={() => navigate('/projects/new')}
            className="flex items-center gap-2 bg-primary text-primary-foreground text-[11px] font-bold uppercase tracking-[0.12em] px-5 py-2.5 rounded-xl hover:opacity-90 transition-all duration-150 shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" /> Nieuw Project
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-5 mb-10">
        <StatCard
          label="Gepland"
          value={planned.length}
          icon={Calendar}
          color="primary"
          action={{ label: 'Bekijk planning', onClick: () => navigate('/planning?view=kalender') }}
        />
        <StatCard
          label="Afgerond"
          value={completed.length}
          icon={CheckCircle2}
          color="green"
          subtitle="Totaal afgerond"
        />
        <StatCard
          label="Actie Vereist"
          value={actionRequired}
          icon={AlertTriangle}
          color="red"
          subtitle={actionRequired > 0 ? 'Directe actie vereist' : 'Alles op schema'}
        />
      </div>

      {/* Overdue alert */}
      {overdueProjects.length > 0 && (
        <button
          onClick={() => navigate('/planning?view=kalender')}
          className="w-full flex items-center gap-4 bg-field-red-bg/50 border border-field-red/10 rounded-xl px-5 py-3.5 mb-6 hover:bg-field-red-bg/70 transition-colors group"
        >
          <div className="w-9 h-9 rounded-lg bg-field-red/10 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-4 w-4 text-field-red" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-[13px] font-semibold text-field-red">
              {overdueProjects.length} {overdueProjects.length === 1 ? 'project' : 'projecten'} achterstallig
            </p>
            <p className="text-[11px] text-field-red/60 mt-0.5">Bekijk in de planning</p>
          </div>
          <ArrowRight className="h-4 w-4 text-field-red/40 group-hover:text-field-red/70 transition-colors" />
        </button>
      )}

      {/* Recent projects */}
      <div className="bg-card rounded-xl border border-border/30 overflow-hidden shadow-[0_1px_3px_hsl(var(--foreground)/0.03)]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/20">
          <div>
            <h3 className="font-display text-[14px] font-bold text-foreground tracking-tight">Recente Projecten</h3>
            <p className="text-[11px] text-muted-foreground/35 mt-0.5">{projects?.length || 0} projecten totaal</p>
          </div>
          {projects && projects.length > 0 && (
            <button
              onClick={() => navigate('/projects')}
              className="text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors uppercase tracking-[0.1em]"
            >
              Alle projecten →
            </button>
          )}
        </div>

        {recentProjects.length > 0 ? (
          <div>
            {recentProjects.map((p, i) => (
              <button
                key={p.id}
                onClick={() => navigate(`/projects/${p.id}`)}
                className={cn(
                  'w-full flex items-center gap-4 px-6 py-3 hover:bg-muted/15 transition-all duration-150 text-left group',
                  i < recentProjects.length - 1 && 'border-b border-border/10'
                )}
              >
                <div className="w-8 h-8 rounded-lg bg-muted/25 flex items-center justify-center shrink-0 group-hover:bg-muted/40 transition-colors">
                  <ProjectIcon status={p.status} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-foreground truncate">{p.project_name}</p>
                  <p className="text-[11px] text-muted-foreground/40 truncate mt-0.5">
                    {[p.project_number, p.city].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <div className="shrink-0 flex items-center gap-4">
                  {p.planned_date && (
                    <span className="text-[11px] text-muted-foreground/40 hidden lg:block font-medium">
                      {formatNlDate(p.planned_date)}
                    </span>
                  )}
                  <ProjectStatusBadge project={p} />
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/15 group-hover:text-muted-foreground/35 transition-colors" />
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="px-6 py-16 text-center">
            <FolderKanban className="h-7 w-7 text-muted-foreground/12 mx-auto mb-3" />
            <p className="text-[13px] text-muted-foreground/40">Nog geen projecten</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── StatCard ── */
function StatCard({ label, value, icon: Icon, color, subtitle, action }: {
  label: string;
  value: number;
  icon: any;
  color: 'primary' | 'green' | 'red';
  subtitle?: string;
  action?: { label: string; onClick: () => void };
}) {
  const colorMap = {
    primary: { bar: 'bg-primary', iconBg: 'bg-primary/[0.07]', iconText: 'text-primary', valueText: 'text-foreground', actionText: 'text-primary' },
    green: { bar: 'bg-field-green', iconBg: 'bg-field-green-bg', iconText: 'text-field-green', valueText: 'text-field-green', actionText: 'text-field-green' },
    red: { bar: 'bg-field-red', iconBg: 'bg-field-red-bg', iconText: 'text-field-red', valueText: 'text-field-red', actionText: 'text-field-red' },
  };
  const c = colorMap[color];

  return (
    <div className="bg-card rounded-xl border border-border/30 p-6 relative overflow-hidden shadow-[0_1px_3px_hsl(var(--foreground)/0.03)] hover:border-border/50 transition-all duration-200 group">
      <div className={`absolute top-0 left-0 w-full h-[2px] ${c.bar}`} />
      <div className="flex items-center justify-between mb-5">
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/50">{label}</span>
        <div className={`w-9 h-9 rounded-xl ${c.iconBg} flex items-center justify-center`}>
          <Icon className={`h-4 w-4 ${c.iconText}`} />
        </div>
      </div>
      <p className={`font-display text-[34px] font-black leading-none tracking-tight ${c.valueText}`}>{value}</p>
      {action ? (
        <button onClick={action.onClick} className={`flex items-center gap-1.5 mt-4 text-[11px] font-semibold ${c.actionText} hover:underline`}>
          {action.label} <ArrowRight className="h-3 w-3" />
        </button>
      ) : (
        <p className="text-[11px] text-muted-foreground/40 mt-4">{subtitle}</p>
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
  if (status === 'completed') return <CheckCircle2 className="h-5 w-5 text-field-green" />;
  return <Building2 className="h-5 w-5 text-muted-foreground/60" />;
}

function ProjectStatusBadge({ project }: { project: any }) {
  if (project.status === 'completed') {
    return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-field-green-bg text-field-green uppercase tracking-wider">Voldoet</span>;
  }

  try {
    if (project.planned_date) {
      const d = parseISO(project.planned_date);
      if (isPast(d) && !isToday(d)) {
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-field-red-bg text-field-red uppercase tracking-wider">Afwijking</span>;
      }
    }
  } catch {}

  return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-primary/10 text-primary uppercase tracking-wider">Gepland</span>;
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
