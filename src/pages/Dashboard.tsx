import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';
import { useProjects } from '@/hooks/use-projects';
import { useTechnicians } from '@/hooks/use-technicians';
import { FolderKanban, CheckCircle2, HardHat, FileText, Clock, MapPin, Calendar } from 'lucide-react';

export default function Dashboard() {
  const { tenant } = useTenant();
  const { profile } = useAuth();
  const { data: projects } = useProjects();
  const { data: technicians } = useTechnicians();
  const navigate = useNavigate();

  const planned = projects?.filter(p => p.status === 'planned') ?? [];
  const completed = projects?.filter(p => p.status === 'completed') ?? [];
  const activeTechs = technicians?.filter(t => t.is_active) ?? [];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={`Welkom terug${profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}`}
        description={`${tenant?.company_name || 'Uw bedrijf'} — Veldwerk Dashboard`}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard title="Actieve Projecten" value={planned.length} icon={FolderKanban} description={`${planned.length} gepland`} />
        <StatCard title="Afgerond" value={completed.length} icon={CheckCircle2} description="Totaal afgerond" />
        <StatCard title="Monteurs" value={activeTechs.length} icon={HardHat} description={`${activeTechs.length} actief`} />
        <StatCard title="Totaal Projecten" value={projects?.length ?? 0} icon={FileText} description="Alle tijd" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Recente Projecten
            </CardTitle>
          </CardHeader>
          <CardContent>
            {projects && projects.length > 0 ? (
              <div className="space-y-1">
                {projects.slice(0, 5).map((p) => (
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
                        {p.planned_date && <span className="flex items-center gap-1 hidden sm:flex"><Calendar className="h-3 w-3" />{p.planned_date}</span>}
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

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <HardHat className="h-4 w-4 text-muted-foreground" />
              Teamleden
            </CardTitle>
          </CardHeader>
          <CardContent>
            {technicians && technicians.length > 0 ? (
              <div className="space-y-1">
                {technicians.slice(0, 5).map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between py-2.5 px-2 -mx-2 rounded-md border-b border-border last:border-0 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/technicians/${t.id}`)}
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{t.full_name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{t.employee_code || '—'}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${t.is_active ? 'status-completed' : 'status-archived'}`}>
                      {t.is_active ? 'Actief' : 'Inactief'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">Nog geen monteurs</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
