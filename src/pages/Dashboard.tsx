import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';
import { useProjects } from '@/hooks/use-projects';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatNlDate, formatNlDateCompact } from '@/lib/nl-date';
import {
  FolderKanban, CheckCircle2, HardHat, Clock, MapPin,
  Calendar, ChevronRight, TrendingUp, ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { isToday, parseISO, isPast } from 'date-fns';

export default function Dashboard() {
  const { tenant, branding } = useTenant();
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
  const logoUrl = branding?.compact_logo_url || branding?.logo_url;

  if (isMobile) {
    return (
      <div className="animate-fade-in">
        {/* Welcome section */}
        <div className="mb-5">
          <h1 className="text-[20px] font-bold text-foreground leading-tight">
            {greeting}{firstName ? `, ${firstName}` : ''}
          </h1>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          <MiniStat
            label="Gepland"
            value={planned.length}
            accent={planned.length > 0}
          />
          <MiniStat
            label="Afgerond"
            value={completed.length}
          />
          <MiniStat
            label="Vandaag"
            value={todayProjects.length}
            accent={todayProjects.length > 0}
            highlight
          />
        </div>

        {/* Overdue alert */}
        {overdueProjects.length > 0 && (
          <button
            onClick={() => navigate('/planning')}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-destructive/5 border border-destructive/10 mb-4 active:scale-[0.98] transition-all"
          >
            <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
              <Clock className="h-3.5 w-3.5 text-destructive/70" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-destructive/80">
                {overdueProjects.length} {overdueProjects.length === 1 ? 'project' : 'projecten'} achterstallig
              </p>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-destructive/30" />
          </button>
        )}

        {/* Today section */}
        {todayProjects.length > 0 && (
          <div className="mb-4">
            <SectionHeader title="Vandaag" count={todayProjects.length} highlight />
            <div className="space-y-1.5">
              {todayProjects.map(p => (
                <ProjectRow key={p.id} project={p} onClick={() => navigate(`/projects/${p.id}`)} />
              ))}
            </div>
          </div>
        )}

        {/* Recent projects */}
        <div>
          <SectionHeader
            title="Recente projecten"
            action={
              projects && projects.length > 6 ? (
                <button
                  onClick={() => navigate('/projects')}
                  className="text-[10px] font-semibold text-[hsl(var(--tenant-primary,var(--primary))/0.6)] flex items-center gap-0.5"
                >
                  Alles <ArrowRight className="h-2.5 w-2.5" />
                </button>
              ) : undefined
            }
          />
          {projects && projects.length > 0 ? (
            <div className="space-y-1.5">
              {projects.slice(0, 6).map(p => (
                <ProjectRow key={p.id} project={p} onClick={() => navigate(`/projects/${p.id}`)} showDate />
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <FolderKanban className="h-7 w-7 text-muted-foreground/15 mx-auto mb-2" />
              <p className="text-[12px] text-muted-foreground/50">Nog geen projecten</p>
            </div>
          )}
        </div>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCardNew title="Actief gepland" value={planned.length} icon={FolderKanban} trend={todayProjects.length > 0 ? `${todayProjects.length} vandaag` : undefined} />
        <StatCardNew title="Afgerond" value={completed.length} icon={CheckCircle2} />
        <StatCardNew title="Totaal" value={projects?.length ?? 0} icon={HardHat} />
        {overdueProjects.length > 0 && (
          <StatCardNew title="Achterstallig" value={overdueProjects.length} icon={Clock} alert />
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
            <TrendingUp className="h-4 w-4 text-muted-foreground/50" />
            Recente projecten
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {projects && projects.length > 0 ? (
            <div className="space-y-0.5">
              {projects.slice(0, 8).map(p => (
                <div
                  key={p.id}
                  className="flex items-center justify-between py-2.5 px-3 -mx-3 rounded-lg hover:bg-muted/40 cursor-pointer transition-colors group"
                  onClick={() => navigate(`/projects/${p.id}`)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[hsl(var(--tenant-primary,var(--primary))/0.06)] flex items-center justify-center shrink-0">
                      <FolderKanban className="h-3.5 w-3.5 text-[hsl(var(--tenant-primary,var(--primary))/0.5)]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{p.project_name}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground/60 mt-0.5">
                        <span className="font-mono">{p.project_number}</span>
                        {p.city && <span className="flex items-center gap-1"><MapPin className="h-2.5 w-2.5" />{p.city}</span>}
                        {p.planned_date && <span className="flex items-center gap-1"><Calendar className="h-2.5 w-2.5" />{formatNlDate(p.planned_date)}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={cn(
                      'text-[10px] px-2 py-0.5 rounded-md font-semibold',
                      p.status === 'completed' ? 'status-completed' : 'status-planned'
                    )}>
                      {p.status === 'completed' ? 'Afgerond' : 'Gepland'}
                    </span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/20 group-hover:text-muted-foreground/40 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">Nog geen projecten</p>
          )}
        </CardContent>
      </Card>
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

function MiniStat({ label, value, accent, highlight }: { label: string; value: number; accent?: boolean; highlight?: boolean }) {
  return (
    <div className={cn(
      'rounded-xl border px-3 py-2.5 text-center transition-colors',
      highlight && value > 0
        ? 'border-[hsl(var(--tenant-primary,var(--primary))/0.2)] bg-[hsl(var(--tenant-primary,var(--primary))/0.03)]'
        : 'border-border/30 bg-card'
    )}>
      <p className={cn(
        'text-[18px] font-bold tabular-nums',
        accent ? 'text-[hsl(var(--tenant-primary,var(--primary)))]' : 'text-foreground'
      )}>{value}</p>
      <p className="text-[10px] text-muted-foreground/50 font-medium mt-0.5">{label}</p>
    </div>
  );
}

function StatCardNew({ title, value, icon: Icon, trend, alert }: {
  title: string; value: number; icon: any; trend?: string; alert?: boolean;
}) {
  return (
    <Card className={cn(alert && 'border-destructive/20 bg-destructive/[0.02]')}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[12px] font-medium text-muted-foreground/70">{title}</p>
            <p className={cn(
              'text-2xl font-bold tracking-tight mt-1',
              alert ? 'text-destructive' : 'text-foreground'
            )}>{value}</p>
            {trend && <p className="text-[10px] text-[hsl(var(--tenant-primary,var(--primary))/0.6)] font-medium mt-1">{trend}</p>}
          </div>
          <div className={cn(
            'h-10 w-10 rounded-xl flex items-center justify-center',
            alert ? 'bg-destructive/8' : 'bg-[hsl(var(--tenant-primary,var(--primary))/0.06)]'
          )}>
            <Icon className={cn(
              'h-5 w-5',
              alert ? 'text-destructive/50' : 'text-[hsl(var(--tenant-primary,var(--primary))/0.4)]'
            )} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SectionHeader({ title, count, highlight, action }: {
  title: string; count?: number; highlight?: boolean; action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-2 px-0.5">
      <div className="flex items-center gap-2">
        <h3 className={cn(
          'text-[11px] uppercase tracking-widest font-semibold',
          highlight ? 'text-[hsl(var(--tenant-primary,var(--primary))/0.7)]' : 'text-muted-foreground/50'
        )}>{title}</h3>
        {count !== undefined && count > 0 && (
          <span className={cn(
            'text-[9px] font-bold px-1.5 py-0.5 rounded-full',
            highlight
              ? 'bg-[hsl(var(--tenant-primary,var(--primary))/0.1)] text-[hsl(var(--tenant-primary,var(--primary))/0.7)]'
              : 'bg-muted text-muted-foreground/60'
          )}>{count}</span>
        )}
      </div>
      {action}
    </div>
  );
}

function ProjectRow({ project: p, onClick, showDate }: {
  project: any; onClick: () => void; showDate?: boolean;
}) {
  const today = p.planned_date ? isToday(parseISO(p.planned_date)) : false;
  const overdue = p.planned_date && !today ? isPast(parseISO(p.planned_date)) : false;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border bg-card transition-all text-left active:scale-[0.998]',
        today
          ? 'border-[hsl(var(--tenant-primary,var(--primary))/0.15)] bg-[hsl(var(--tenant-primary,var(--primary))/0.02)]'
          : overdue
            ? 'border-destructive/10 bg-destructive/[0.01]'
            : 'border-border/30 hover:bg-muted/15'
      )}
    >
      <div className={cn(
        'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
        today
          ? 'bg-[hsl(var(--tenant-primary,var(--primary))/0.1)]'
          : 'bg-[hsl(var(--tenant-primary,var(--primary))/0.05)]'
      )}>
        <FolderKanban className={cn(
          'h-3.5 w-3.5',
          today
            ? 'text-[hsl(var(--tenant-primary,var(--primary))/0.7)]'
            : 'text-[hsl(var(--tenant-primary,var(--primary))/0.4)]'
        )} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-foreground truncate">{p.project_name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-muted-foreground/50 font-mono">{p.project_number}</span>
          {p.city && (
            <span className="text-[10px] text-muted-foreground/50 flex items-center gap-0.5">
              <MapPin className="h-2.5 w-2.5" />{p.city}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {showDate && p.planned_date && (
          <span className="text-[10px] text-muted-foreground/40 tabular-nums font-medium">
            {formatNlDateCompact(p.planned_date)}
          </span>
        )}
        <span className={cn(
          'text-[9px] px-1.5 py-0.5 rounded font-semibold',
          p.status === 'completed' ? 'status-completed' : 'status-planned'
        )}>
          {p.status === 'completed' ? 'Afgerond' : 'Gepland'}
        </span>
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/20" />
      </div>
    </button>
  );
}
