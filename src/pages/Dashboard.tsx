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

  // ── Desktop layout — Industrial Field Ops ──
  const recentProjects = projects?.slice(0, 6) ?? [];
  const actionRequired = overdueProjects.length;

  return (
    <div className="animate-fade-in space-y-8">
      {/* Greeting */}
      <div>
        <p className="text-sm text-muted-foreground mb-1">
          {greeting},
        </p>
        <h1 className="font-display text-[32px] font-black text-foreground tracking-tight leading-none">
          {profile?.full_name || 'Gebruiker'}
        </h1>
      </div>

      {/* Page title */}
      <div>
        <h2 className="font-display text-[22px] font-black text-foreground tracking-tight">
          Aardingsmeting Dashboard
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Real-time overzicht van lopende metingen en operationele status.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-5">
        {/* Gepland */}
        <div className="bg-card rounded border border-border p-5 border-b-4 border-b-[hsl(var(--primary))]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded bg-[hsl(var(--primary)/0.1)] flex items-center justify-center">
              <Calendar className="h-5 w-5 text-[hsl(var(--primary))]" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Gepland</span>
          </div>
          <p className="font-display text-[40px] font-black text-foreground leading-none">{planned.length}</p>
          <button
            onClick={() => navigate('/planning?view=kalender')}
            className="flex items-center gap-1.5 mt-3 text-[12px] font-semibold text-[hsl(var(--primary))] hover:underline"
          >
            Bekijk planning <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Afgerond */}
        <div className="bg-card rounded border border-border p-5 border-b-4 border-b-field-green">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded bg-field-green-bg flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-field-green" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Afgerond</span>
          </div>
          <p className="font-display text-[40px] font-black text-field-green leading-none">{completed.length}</p>
          <p className="text-[12px] text-muted-foreground mt-3">Laatste 7 dagen</p>
        </div>

        {/* Actie vereist */}
        <div className="bg-card rounded border border-border p-5 border-b-4 border-b-field-red">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded bg-field-red-bg flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-field-red" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Actie Vereist</span>
          </div>
          <p className="font-display text-[40px] font-black text-field-red leading-none">{actionRequired}</p>
          <p className="flex items-center gap-1 text-[12px] text-field-red font-semibold mt-3">
            Directe actie vereist <AlertTriangle className="h-3 w-3" />
          </p>
        </div>
      </div>

      {/* Asymmetric grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left — Recent projects (8 cols) */}
        <div className="col-span-8">
          <div className="bg-card rounded border border-border overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="font-display text-[16px] font-bold text-foreground">Recente Projecten</h3>
              <button
                onClick={() => navigate('/projects/new')}
                className="flex items-center gap-2 bg-[hsl(var(--primary))] text-white text-[12px] font-bold uppercase tracking-wider px-4 py-2 rounded hover:opacity-90 transition-opacity"
              >
                <Plus className="h-3.5 w-3.5" /> Nieuw Project
              </button>
            </div>

            {recentProjects.length > 0 ? (
              <div className="divide-y divide-border/50">
                {recentProjects.map(p => (
                  <button
                    key={p.id}
                    onClick={() => navigate(`/projects/${p.id}`)}
                    className="w-full flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded bg-muted/40 flex items-center justify-center shrink-0">
                      <ProjectIcon status={p.status} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-foreground truncate">{p.project_name}</p>
                      <p className="text-[12px] text-muted-foreground truncate">
                        {[p.city, p.address_line_1].filter(Boolean).join(', ') || p.project_number}
                      </p>
                    </div>
                    <div className="text-right shrink-0 flex items-center gap-4">
                      {p.planned_date && (
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Deadline</p>
                          <p className="text-[13px] font-medium text-foreground">{formatNlDate(p.planned_date)}</p>
                        </div>
                      )}
                      <ProjectStatusBadge project={p} />
                      <ChevronRight className="h-4 w-4 text-muted-foreground/30" />
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="px-5 py-12 text-center">
                <FolderKanban className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Nog geen projecten</p>
              </div>
            )}
          </div>
        </div>

        {/* Right — Info panel (4 cols) */}
        <div className="col-span-4 space-y-6">
          {/* Active locations */}
          <div className="bg-card rounded border border-border overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="font-display text-[16px] font-bold text-foreground">Actieve Locaties</h3>
            </div>
            <div className="aspect-[4/3] bg-muted/20 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-[12px] text-muted-foreground/40">Kaart weergave</p>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-field-green animate-pulse" />
                <span className="text-[12px] font-semibold text-foreground">Live Team Status</span>
              </div>
              <span className="text-[12px] text-muted-foreground">{planned.length} Online</span>
            </div>
            <div className="px-5 pb-4 flex items-center -space-x-2">
              {[...Array(Math.min(3, planned.length || 1))].map((_, i) => (
                <div key={i} className="w-8 h-8 rounded-full bg-muted border-2 border-card flex items-center justify-center">
                  <span className="text-[10px] font-bold text-muted-foreground">{String.fromCharCode(65 + i)}</span>
                </div>
              ))}
              {planned.length > 3 && (
                <div className="w-8 h-8 rounded-full bg-muted/60 border-2 border-card flex items-center justify-center">
                  <span className="text-[9px] font-bold text-muted-foreground">+{planned.length - 3}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
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
    return <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-field-green-bg text-field-green">Voldoet</span>;
  }

  try {
    if (project.planned_date) {
      const d = parseISO(project.planned_date);
      if (isPast(d) && !isToday(d)) {
        return <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-field-red-bg text-field-red">Afwijking</span>;
      }
    }
  } catch {}

  return <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[hsl(var(--primary)/0.1)] text-[hsl(var(--primary))]">Gepland</span>;
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
