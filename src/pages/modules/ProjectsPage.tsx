import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { ListToolbar } from '@/components/ui/list-toolbar';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProjects } from '@/hooks/use-projects';
import { useTechnicians } from '@/hooks/use-technicians';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatNlDate, formatNlDateCompact } from '@/lib/nl-date';
import { cn } from '@/lib/utils';
import { FolderKanban, Plus, Calendar, MapPin, ChevronRight, X } from 'lucide-react';
import { isToday, isThisWeek, isThisMonth, isPast, parseISO } from 'date-fns';

export default function ProjectsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [techFilter, setTechFilter] = useState<string>('all');
  const { data: projects, isLoading } = useProjects();
  const { data: technicians } = useTechnicians();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const hasActiveFilters = statusFilter !== 'all' || dateFilter !== 'all' || techFilter !== 'all' || search !== '';

  const filtered = projects?.filter(p => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;

    // Date filter
    if (dateFilter !== 'all' && p.planned_date) {
      try {
        const d = parseISO(p.planned_date);
        if (dateFilter === 'today' && !isToday(d)) return false;
        if (dateFilter === 'week' && !isThisWeek(d, { weekStartsOn: 1 })) return false;
        if (dateFilter === 'month' && !isThisMonth(d)) return false;
        if (dateFilter === 'overdue' && (!isPast(d) || isToday(d) || p.status === 'completed')) return false;
      } catch { return false; }
    } else if (dateFilter !== 'all' && !p.planned_date) {
      return false;
    }

    // Technician filter
    if (techFilter !== 'all' && p.technician_id !== techFilter) return false;

    // Search
    if (search) {
      return [p.project_number, p.project_name, p.site_name, p.address_line_1, p.city, p.clients?.company_name]
        .filter(Boolean)
        .some(f => f!.toLowerCase().includes(search.toLowerCase()));
    }

    return true;
  }) ?? [];

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setDateFilter('all');
    setTechFilter('all');
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Projecten"
        description={isMobile ? undefined : 'Beheer meet- en inspectieprojecten'}
        action={<Button size={isMobile ? 'sm' : 'default'} onClick={() => navigate('/projects/new')} className="rounded-xl"><Plus className="mr-1.5 h-4 w-4" /> Nieuw</Button>}
      />

      {isLoading ? (
        <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>
      ) : projects?.length === 0 ? (
        <EmptyState icon={FolderKanban} title="Nog geen projecten" description="Maak uw eerste project aan om veldwerk te organiseren."
          action={<Button variant="outline" onClick={() => navigate('/projects/new')} className="rounded-xl"><Plus className="mr-2 h-4 w-4" /> Project aanmaken</Button>}
        />
      ) : (
        <>
          <ListToolbar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Zoek op naam, nummer, adres of klant…">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className={cn(isMobile ? 'w-28 h-8 text-xs rounded-lg' : 'w-32 rounded-lg')}>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle</SelectItem>
                <SelectItem value="planned">Gepland</SelectItem>
                <SelectItem value="completed">Afgerond</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className={cn(isMobile ? 'w-28 h-8 text-xs rounded-lg' : 'w-32 rounded-lg')}>
                <SelectValue placeholder="Datum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle data</SelectItem>
                <SelectItem value="today">Vandaag</SelectItem>
                <SelectItem value="week">Deze week</SelectItem>
                <SelectItem value="month">Deze maand</SelectItem>
                <SelectItem value="overdue">Achterstallig</SelectItem>
              </SelectContent>
            </Select>
            {!isMobile && technicians && technicians.length > 0 && (
              <Select value={techFilter} onValueChange={setTechFilter}>
                <SelectTrigger className="w-40 rounded-lg">
                  <SelectValue placeholder="Monteur" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle monteurs</SelectItem>
                  {technicians.filter(t => t.is_active).map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </ListToolbar>

          {/* Results counter */}
          <div className="flex items-center justify-between mb-3 px-0.5">
            <span className="text-[11px] text-muted-foreground/40">
              {filtered.length} van {projects?.length} projecten
            </span>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="text-[11px] font-medium text-[hsl(var(--tenant-primary))] flex items-center gap-1 hover:opacity-80 transition-opacity">
                <X className="h-3 w-3" /> Filters wissen
              </button>
            )}
          </div>

          {/* Desktop */}
          <div className="hidden lg:block">
            <div className="rounded-2xl bg-card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/30">
                    <th className="text-left text-[11px] font-medium text-muted-foreground/50 px-4 py-2.5 uppercase tracking-wider">Nummer</th>
                    <th className="text-left text-[11px] font-medium text-muted-foreground/50 px-4 py-2.5 uppercase tracking-wider">Project</th>
                    <th className="text-left text-[11px] font-medium text-muted-foreground/50 px-4 py-2.5 uppercase tracking-wider">Locatie</th>
                    <th className="text-left text-[11px] font-medium text-muted-foreground/50 px-4 py-2.5 uppercase tracking-wider">Datum</th>
                    <th className="text-left text-[11px] font-medium text-muted-foreground/50 px-4 py-2.5 uppercase tracking-wider">Klant</th>
                    <th className="text-left text-[11px] font-medium text-muted-foreground/50 px-4 py-2.5 uppercase tracking-wider">Monteur</th>
                    <th className="text-left text-[11px] font-medium text-muted-foreground/50 px-4 py-2.5 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {filtered.map(p => (
                    <tr key={p.id} className="hover:bg-foreground/[0.015] cursor-pointer transition-colors" onClick={() => navigate(`/projects/${p.id}`)}>
                      <td className="px-4 py-3 text-sm font-mono text-muted-foreground/50">{p.project_number}</td>
                      <td className="px-4 py-3 text-sm font-medium text-foreground">{p.project_name}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground/50">{[p.city, p.country].filter(Boolean).join(', ') || '—'}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground/50">{formatNlDate(p.planned_date)}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground/50">{p.clients?.company_name || '—'}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground/50">{p.technicians?.full_name || '—'}</td>
                      <td className="px-4 py-3">
                        <StatusPill status={p.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile */}
          <div className="lg:hidden">
            <div className="ios-group overflow-hidden divide-y divide-border/20">
              {filtered.map(p => (
                <button
                  key={p.id}
                  onClick={() => navigate(`/projects/${p.id}`)}
                  className="w-full flex items-center gap-3 px-4 py-3 transition-colors text-left active:bg-foreground/[0.02]"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-foreground truncate leading-snug">{p.project_name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-muted-foreground/35 font-mono">{p.project_number}</span>
                      {p.city && <span className="text-[11px] text-muted-foreground/35 flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{p.city}</span>}
                      {p.planned_date && <span className="text-[11px] text-muted-foreground/35 flex items-center gap-0.5"><Calendar className="h-2.5 w-2.5" />{formatNlDateCompact(p.planned_date)}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <StatusDot status={p.status} />
                    <ChevronRight className="h-4 w-4 text-muted-foreground/12" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 && hasActiveFilters && (
            <p className="text-sm text-muted-foreground/40 text-center py-8">Geen projecten gevonden</p>
          )}
        </>
      )}
    </div>
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

function StatusPill({ status }: { status: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={cn(
        'w-[6px] h-[6px] rounded-full',
        status === 'completed' ? 'bg-[hsl(var(--status-completed))]' : 'bg-[hsl(var(--status-planned)/0.4)]'
      )} />
      <span className="text-[11px] text-muted-foreground/45 font-medium">
        {status === 'completed' ? 'Afgerond' : 'Gepland'}
      </span>
    </div>
  );
}
