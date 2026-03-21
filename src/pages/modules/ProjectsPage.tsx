import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { ListToolbar } from '@/components/ui/list-toolbar';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProjects } from '@/hooks/use-projects';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatNlDate, formatNlDateCompact } from '@/lib/nl-date';
import { cn } from '@/lib/utils';
import { FolderKanban, Plus, Calendar, MapPin, User, ChevronRight } from 'lucide-react';

export default function ProjectsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { data: projects, isLoading } = useProjects();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const filtered = projects?.filter(p => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    return [p.project_number, p.project_name, p.site_name, p.city, p.clients?.company_name]
      .filter(Boolean)
      .some(f => f!.toLowerCase().includes(search.toLowerCase()));
  }) ?? [];

  const StatusLabel = ({ status }: { status: string }) => (
    <span className={cn(
      'text-[9px] px-1.5 py-0.5 rounded-md font-semibold',
      status === 'completed' ? 'status-completed' : 'status-planned'
    )}>
      {status === 'completed' ? 'Afgerond' : 'Gepland'}
    </span>
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Projecten"
        description="Beheer meet- en inspectieprojecten"
        action={<Button size={isMobile ? 'sm' : 'default'} onClick={() => navigate('/projects/new')}><Plus className="mr-1.5 h-4 w-4" /> Nieuw project</Button>}
      />

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
      ) : projects?.length === 0 ? (
        <EmptyState icon={FolderKanban} title="Nog geen projecten" description="Maak uw eerste project aan om veldwerk te organiseren."
          action={<Button variant="outline" onClick={() => navigate('/projects/new')}><Plus className="mr-2 h-4 w-4" /> Project aanmaken</Button>}
        />
      ) : (
        <>
          <ListToolbar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Projecten zoeken...">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className={cn(isMobile ? 'w-28 h-8 text-xs' : 'w-36')}>
                <SelectValue placeholder="Alle statussen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle statussen</SelectItem>
                <SelectItem value="planned">Gepland</SelectItem>
                <SelectItem value="completed">Afgerond</SelectItem>
              </SelectContent>
            </Select>
          </ListToolbar>

          {/* Desktop table */}
          <div className="hidden lg:block">
            <Card>
              <CardContent className="p-0">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Project #</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Naam</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Locatie</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Datum</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Klant</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Monteur</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(p => (
                      <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => navigate(`/projects/${p.id}`)}>
                        <td className="px-4 py-3 text-sm font-mono text-muted-foreground">{p.project_number}</td>
                        <td className="px-4 py-3 text-sm font-medium text-foreground">{p.project_name}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{[p.city, p.country].filter(Boolean).join(', ') || '—'}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{formatNlDate(p.planned_date)}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{p.clients?.company_name || '—'}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{p.technicians?.full_name || '—'}</td>
                        <td className="px-4 py-3"><StatusLabel status={p.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>

          {/* Mobile list */}
          <div className="lg:hidden space-y-1.5">
            {filtered.map(p => (
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
                    {p.planned_date && <span className="text-[10px] text-muted-foreground/60 flex items-center gap-0.5"><Calendar className="h-2.5 w-2.5" />{formatNlDateCompact(p.planned_date)}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusLabel status={p.status} />
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30" />
                </div>
              </button>
            ))}
          </div>

          {filtered.length === 0 && (search || statusFilter !== 'all') && (
            <p className="text-sm text-muted-foreground text-center py-8">Geen projecten gevonden</p>
          )}
        </>
      )}
    </div>
  );
}
