import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';
import { useProjects } from '@/hooks/use-projects';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatNlDate, formatNlDateCompact } from '@/lib/nl-date';
import {
  FolderKanban, CheckCircle2, Clock, MapPin,
  Calendar, ChevronRight, ArrowRight,
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

  if (isMobile) {
    return (
      <div className="animate-fade-in space-y-5">
        {/* Greeting */}
        <div className="pt-1">
          <h1 className="text-[24px] font-bold text-foreground tracking-tight leading-tight">
            {greeting}{firstName ? `, ${firstName}` : ''}
          </h1>
          <p className="text-[13px] text-muted-foreground/50 mt-1">
            {todayProjects.length > 0
              ? `${todayProjects.length} ${todayProjects.length === 1 ? 'project' : 'projecten'} vandaag`
              : 'Geen projecten vandaag gepland'}
          </p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-8">
          <StatInline label="Gepland" value={planned.length} active={planned.length > 0} />
          <StatInline label="Afgerond" value={completed.length} />
          {overdueProjects.length > 0 && (
            <StatInline label="Achterstallig" value={overdueProjects.length} alert />
          )}
        </div>

        {/* Overdue */}
        {overdueProjects.length > 0 && (
          <button
            onClick={() => navigate('/planning')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-destructive/[0.04] active:scale-[0.98] transition-all"
          >
            <Clock className="h-4 w-4 text-destructive/60 shrink-0" />
            <span className="text-[13px] font-medium text-destructive/80 flex-1 text-left">
              {overdueProjects.length} {overdueProjects.length === 1 ? 'project' : 'projecten'} achterstallig
            </span>
            <ChevronRight className="h-4 w-4 text-destructive/20" />
          </button>
        )}

        {/* Today */}
        {todayProjects.length > 0 && (
          <section>
            <SectionLabel>Vandaag</SectionLabel>
            <div className="ios-group overflow-hidden divide-y divide-border/20">
              {todayProjects.map(p => (
                <ProjectRow key={p.id} project={p} onClick={() => navigate(`/projects/${p.id}`)} />
              ))}
            </div>
          </section>
        )}

        {/* Recent */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <SectionLabel noMargin>Recente projecten</SectionLabel>
            {projects && projects.length > 6 && (
              <button
                onClick={() => navigate('/projects')}
                className="text-[12px] font-medium text-muted-foreground/40 flex items-center gap-0.5 active:opacity-60"
              >
                Alles <ArrowRight className="h-3 w-3" />
              </button>
            )}
          </div>
          {projects && projects.length > 0 ? (
            <div className="ios-group overflow-hidden divide-y divide-border/20">
              {projects.slice(0, 6).map(p => (
                <ProjectRow key={p.id} project={p} onClick={() => navigate(`/projects/${p.id}`)} showDate />
              ))}
            </div>
          ) : (
            <div className="text-center py-14">
              <FolderKanban className="h-6 w-6 text-muted-foreground/12 mx-auto mb-2" />
              <p className="text-[13px] text-muted-foreground/35">Nog geen projecten</p>
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
                  <StatusDot status={p.status} />
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

function StatInline({ label, value, active, alert }: { label: string; value: number; active?: boolean; alert?: boolean }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className={cn(
        'text-[22px] font-bold tabular-nums tracking-tight',
        alert ? 'text-destructive' : active ? 'text-foreground' : 'text-foreground/60'
      )}>{value}</span>
      <span className="text-[11px] text-muted-foreground/45 font-medium">{label}</span>
    </div>
  );
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

function SectionLabel({ children, noMargin }: { children: React.ReactNode; noMargin?: boolean }) {
  return (
    <p className={cn(
      'text-[11px] uppercase tracking-[0.08em] font-semibold text-muted-foreground/40',
      !noMargin && 'mb-2'
    )}>{children}</p>
  );
}

function StatusDot({ status }: { status: string }) {
  return (
    <span className={cn(
      'w-[6px] h-[6px] rounded-full',
      status === 'completed' ? 'bg-[hsl(var(--status-completed))]' : 'bg-[hsl(var(--status-planned)/0.4)]'
    )} />
  );
}

function ProjectRow({ project: p, onClick, showDate }: {
  project: any; onClick: () => void; showDate?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 transition-colors text-left active:bg-foreground/[0.02]"
    >
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold text-foreground truncate leading-snug">{p.project_name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[11px] text-muted-foreground/35 font-mono">{p.project_number}</span>
          {p.city && (
            <span className="text-[11px] text-muted-foreground/35 flex items-center gap-0.5">
              <MapPin className="h-2.5 w-2.5" />{p.city}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2.5 shrink-0">
        {showDate && p.planned_date && (
          <span className="text-[11px] text-muted-foreground/30 tabular-nums">
            {formatNlDateCompact(p.planned_date)}
          </span>
        )}
        <StatusDot status={p.status} />
        <ChevronRight className="h-4 w-4 text-muted-foreground/12" />
      </div>
    </button>
  );
}
