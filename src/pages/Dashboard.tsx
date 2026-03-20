import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';
import { useProjects } from '@/hooks/use-projects';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatNlDate } from '@/lib/nl-date';
import { FolderKanban, CheckCircle2, HardHat, Clock, MapPin, Calendar, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const { tenant } = useTenant();
  const { profile } = useAuth();
  const { data: projects } = useProjects();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const planned = projects?.filter(p => p.status === 'planned') ?? [];
  const completed = projects?.filter(p => p.status === 'completed') ?? [];

  if (isMobile) {
    return (
      <div className="animate-fade-in">
        <PageHeader
          title={`Welkom${profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}`}
          description={tenant?.company_name || 'Uw bedrijf'}
        />

        <div className="grid grid-cols-3 gap-2 mb-4">
          <MiniStat label="Gepland" value={planned.length} />
          <MiniStat label="Afgerond" value={completed.length} />
          <MiniStat label="Totaal" value={projects?.length ?? 0} />
        </div>

        <div className="mb-2">
          <h3 className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground/60 px-0.5 mb-2">Recente projecten</h3>
        </div>

        {projects && projects.length > 0 ? (
          <div className="space-y-1.5">
            {projects.slice(0, 6).map((p) => (
              <button
                key={p.id}
                onClick={() => navigate(`/projects/${p.id}`)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border/30 bg-card hover:bg-muted/15 transition-all text-left active:scale-[0.998]"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-foreground truncate">{p.project_name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-muted-foreground/60 font-mono">{p.project_number}</span>
                    {p.city && <span className="text-[10px] text-muted-foreground/60 flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{p.city}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={cn(
                    'text-[10px] px-1.5 py-0.5 rounded font-medium',
                    p.status === 'completed' ? 'status-completed' : 'status-planned'
                  )}>
                    {p.status === 'completed' ? 'Afgerond' : 'Gepland'}
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30" />
                </div>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-[12px] text-muted-foreground text-center py-8">Nog geen projecten</p>
        )}
      </div>
    );
  }

  // Desktop
  return (
    <div className="animate-fade-in">
      <PageHeader
        title={`Welkom terug${profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}`}
        description={`${tenant?.company_name || 'Uw bedrijf'} — Veldwerk Dashboard`}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard title="Actieve projecten" value={planned.length} icon={FolderKanban} description={`${planned.length} gepland`} />
        <StatCard title="Afgerond" value={completed.length} icon={CheckCircle2} description="Totaal afgerond" />
        <StatCard title="Totaal projecten" value={projects?.length ?? 0} icon={HardHat} description="Alle tijd" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Recente projecten
          </CardTitle>
        </CardHeader>
        <CardContent>
          {projects && projects.length > 0 ? (
            <div className="space-y-1">
              {projects.slice(0, 8).map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between py-2.5 px-2 -mx-2 rounded-md border-b border-border last:border-0 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/projects/${p.id}`)}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{p.project_name}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      <span className="font-mono">{p.project_number}</span>
                      {p.city && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{p.city}</span>}
                      {p.planned_date && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatNlDate(p.planned_date)}</span>}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-md font-medium shrink-0 ml-2 ${
                    p.status === 'completed' ? 'status-completed' : 'status-planned'
                  }`}>
                    {p.status === 'completed' ? 'Afgerond' : 'Gepland'}
                  </span>
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

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border/30 bg-card px-3 py-2.5 text-center">
      <p className="text-lg font-bold text-foreground tabular-nums">{value}</p>
      <p className="text-[10px] text-muted-foreground/60 font-medium mt-0.5">{label}</p>
    </div>
  );
}
