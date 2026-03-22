import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';
import { useProjects } from '@/hooks/use-projects';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatNlDate, formatNlDateCompact } from '@/lib/nl-date';
import {
  FolderKanban, CheckCircle2, Clock, MapPin,
  Calendar, ChevronRight, ArrowRight, AlertTriangle,
  Plus, FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { isToday, parseISO, isPast } from 'date-fns';

export default function Dashboard() {
  const { tenant } = useTenant();
  const { profile } = useAuth();
  const { data: projects } = useProjects();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

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
          <div className="px-4 mt-5 space-y-2">
            {[1,2,3,4].map(i => (
              <div key={i} className="flex items-center gap-3 rounded-xl bg-card p-3 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-muted/30 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-3/4 rounded bg-muted/30" />
                  <div className="h-2.5 w-1/2 rounded bg-muted/20" />
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return (
      <div className="animate-fade-in max-w-2xl mx-auto space-y-4 pt-4">
        <div className="h-8 w-48 rounded-lg bg-muted/30 animate-pulse" />
        <div className="grid grid-cols-3 gap-3">
          {[1,2,3].map(i => (
            <div key={i} className="rounded-xl bg-card p-4 h-20 animate-pulse" />
          ))}
        </div>
        <div className="space-y-2">
          {[1,2,3].map(i => (
            <div key={i} className="h-16 rounded-xl bg-card animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="ios-dash animate-fade-in">
        {/* Greeting */}
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

        {/* Stats */}
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

        {/* Quick actions */}
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

        {/* Alert banner */}
        {overdueProjects.length > 0 && (
          <button
            onClick={() => navigate('/planning')}
            className="ios-dash-alert"
          >
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

        {/* Today */}
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

        {/* Recent projects */}
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

  // Desktop
  return (
    <div className="animate-fade-in">
      <PageHeader
        title={`${greeting}${firstName ? `, ${firstName}` : ''}`}
        description={`${tenant?.company_name || 'Uw bedrijf'} — Veldwerk Dashboard`}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <DesktopStatCard title="Gepland" value={planned.length} sub={todayProjects.length > 0 ? `${todayProjects.length} vandaag` : undefined} />
        <DesktopStatCard title="Afgerond" value={completed.length} />
        {overdueProjects.length > 0 ? (
          <DesktopStatCard title="Achterstallig" value={overdueProjects.length} alert />
        ) : (
          <DesktopStatCard title="Totaal" value={projects?.length ?? 0} />
        )}
      </div>

      <div>
        <h2 className="text-[13px] font-semibold text-foreground mb-3">Recente projecten</h2>
        {projects && projects.length > 0 ? (
          <div className="rounded-2xl bg-card overflow-hidden divide-y divide-border/30">
            {projects.slice(0, 8).map(p => (
              <div
                key={p.id}
                className="flex items-center justify-between py-3 px-4 hover:bg-foreground/[0.02] cursor-pointer transition-colors group"
                onClick={() => navigate(`/projects/${p.id}`)}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{p.project_name}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground/40 mt-0.5">
                    <span className="font-mono">{p.project_number}</span>
                    {p.city && <span className="flex items-center gap-1"><MapPin className="h-2.5 w-2.5" />{p.city}</span>}
                    {p.planned_date && <span className="flex items-center gap-1"><Calendar className="h-2.5 w-2.5" />{formatNlDate(p.planned_date)}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <DashStatusDot project={p} />
                  <ChevronRight className="h-4 w-4 text-muted-foreground/10 group-hover:text-muted-foreground/25 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground/40 text-center py-8">Nog geen projecten</p>
        )}
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

function DesktopStatCard({ title, value, sub, alert }: { title: string; value: number; sub?: string; alert?: boolean }) {
  return (
    <div className={cn(
      'rounded-2xl bg-card px-5 py-4',
      alert ? 'ring-1 ring-destructive/10' : ''
    )}>
      <p className="text-[12px] font-medium text-muted-foreground/50 mb-1">{title}</p>
      <p className={cn(
        'text-[28px] font-bold tracking-tight leading-none',
        alert ? 'text-destructive' : 'text-foreground'
      )}>{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground/40 mt-1.5">{sub}</p>}
    </div>
  );
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
    <button
      onClick={onClick}
      className="ios-dash-project-row"
    >
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
