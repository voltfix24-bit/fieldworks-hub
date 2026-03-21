import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { ListToolbar } from '@/components/ui/list-toolbar';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProjects } from '@/hooks/use-projects';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatNlDate, formatNlDateCompact } from '@/lib/nl-date';
import { cn } from '@/lib/utils';
import { FolderKanban, Plus, Calendar, MapPin, ChevronRight } from 'lucide-react';

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

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Projecten"
        description={isMobile ? undefined : 'Beheer meet- en inspectieprojecten'}
        action={<Button size={isMobile ? 'sm' : 'default'} onClick={() => navigate('/projects/new')}><Plus className="mr-1.5 h-4 w-4" /> Nieuw</Button>}
      />

      {isLoading ? (
        <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>
      ) : projects?.length === 0 ? (
        <EmptyState icon={FolderKanban} title="Nog geen projecten" description="Maak uw eerste project aan om veldwerk te organiseren."
          action={<Button variant="outline" onClick={() => navigate('/projects/new')}><Plus className="mr-2 h-4 w-4" /> Project aanmaken</Button>}
        />
      ) : (
        <>
          <ListToolbar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Zoek op naam, nummer of locatie…">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className={cn(isMobile ? 'w-28 h-8 text-xs' : 'w-36')}>
                <SelectValue placeholder="Alle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle</SelectItem>
                <SelectItem value="planned">Gepland</SelectItem>
                <SelectItem value="completed">Afgerond</SelectItem>
              </SelectContent>
            </Select>
          </ListToolbar>

          {/* Desktop */}
          <div className="hidden lg:block">
            <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/40">
                    <th className="text-left text-[11px] font-medium text-muted-foreground/60 px-4 py-2.5 uppercase tracking-wider">Nummer</th>
                    <th className="text-left text-[11px] font-medium text-muted-foreground/60 px-4 py-2.5 uppercase tracking-wider">Project</th>
                    <th className="text-left text-[11px] font-medium text-muted-foreground/60 px-4 py-2.5 uppercase tracking-wider">Locatie</th>
                    <th className="text-left text-[11px] font-medium text-muted-foreground/60 px-4 py-2.5 uppercase tracking-wider">Datum</th>
                    <th className="text-left text-[11px] font-medium text-muted-foreground/60 px-4 py-2.5 uppercase tracking-wider">Klant</th>
                    <th className="text-left text-[11px] font-medium text-muted-foreground/60 px-4 py-2.5 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {filtered.map(p => (
                    <tr key={p.id} className="hover:bg-muted/20 cursor-pointer transition-colors" onClick={() => navigate(`/projects/${p.id}`)}>
                      <td className="px-4 py-3 text-sm font-mono text-muted-foreground/60">{p.project_number}</td>
                      <td className="px-4 py-3 text-sm font-medium text-foreground">{p.project_name}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground/60">{[p.city, p.country].filter(Boolean).join(', ') || '—'}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground/60">{formatNlDate(p.planned_date)}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground/60">{p.clients?.company_name || '—'}</td>
                      <td className="px-4 py-3">
                        <StatusDot status={p.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile */}
          <div className="lg:hidden space-y-1.5">
            {filtered.map(p => (
              <button
                key={p.id}
                onClick={() => navigate(`/projects/${p.id}`)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-card transition-all text-left active:scale-[0.99]"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-foreground truncate leading-snug">{p.project_name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-muted-foreground/45 font-mono">{p.project_number}</span>
                    {p.city && <span className="text-[11px] text-muted-foreground/45 flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{p.city}</span>}
                    {p.planned_date && <span className="text-[11px] text-muted-foreground/45 flex items-center gap-0.5"><Calendar className="h-2.5 w-2.5" />{formatNlDateCompact(p.planned_date)}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  <StatusDot status={p.status} />
                  <ChevronRight className="h-4 w-4 text-muted-foreground/15" />
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

function StatusDot({ status }: { status: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={cn(
        'w-2 h-2 rounded-full',
        status === 'completed' ? 'bg-[hsl(var(--status-completed))]' : 'bg-[hsl(var(--status-planned)/0.5)]'
      )} />
      <span className="text-[11px] text-muted-foreground/50 font-medium">
        {status === 'completed' ? 'Afgerond' : 'Gepland'}
      </span>
    </div>
  );
}
