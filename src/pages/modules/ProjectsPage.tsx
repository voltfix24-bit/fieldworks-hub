import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProjects } from '@/hooks/use-projects';
import { useTechnicians } from '@/hooks/use-technicians';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatNlDate, formatNlDateCompact } from '@/lib/nl-date';
import { cn } from '@/lib/utils';
import { FolderKanban, Plus, Calendar, MapPin, ChevronRight, X, Search, AlertTriangle } from 'lucide-react';
import { isToday, isThisWeek, isThisMonth, isPast, parseISO } from 'date-fns';
import { PageHeader } from '@/components/ui/page-header';
import { ListToolbar } from '@/components/ui/list-toolbar';
import { EmptyState } from '@/components/ui/empty-state';

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
    if (techFilter !== 'all' && p.technician_id !== techFilter) return false;
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

  const plannedCount = projects?.filter(p => p.status === 'planned').length ?? 0;
  const completedCount = projects?.filter(p => p.status === 'completed').length ?? 0;
  const overdueCount = projects?.filter(p => {
    if (p.status !== 'planned' || !p.planned_date) return false;
    try { const d = parseISO(p.planned_date); return isPast(d) && !isToday(d); } catch { return false; }
  }).length ?? 0;

  /* ── Mobile ── */
  if (isMobile) {
    return (
      <div className="animate-fade-in">
        <PageHeader
          title="Projecten"
          action={<Button size="sm" onClick={() => navigate('/projects/new')} className="rounded-xl"><Plus className="mr-1.5 h-4 w-4" /> Nieuw</Button>}
        />
        {isLoading ? (
          <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>
        ) : projects?.length === 0 ? (
          <EmptyState icon={FolderKanban} title="Nog geen projecten" description="Maak uw eerste project aan."
            action={<Button variant="outline" onClick={() => navigate('/projects/new')} className="rounded-xl"><Plus className="mr-2 h-4 w-4" /> Project aanmaken</Button>}
          />
        ) : (
          <>
            <ListToolbar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Zoek op naam, nummer, adres of klant…">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-28 h-8 text-xs rounded-lg"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle</SelectItem>
                  <SelectItem value="planned">Gepland</SelectItem>
                  <SelectItem value="completed">Afgerond</SelectItem>
                </SelectContent>
              </Select>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-28 h-8 text-xs rounded-lg"><SelectValue placeholder="Datum" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle data</SelectItem>
                  <SelectItem value="today">Vandaag</SelectItem>
                  <SelectItem value="week">Deze week</SelectItem>
                  <SelectItem value="month">Deze maand</SelectItem>
                  <SelectItem value="overdue">Achterstallig</SelectItem>
                </SelectContent>
              </Select>
            </ListToolbar>
            <div className="flex items-center justify-between mb-3 px-0.5">
              <span className="text-[11px] text-muted-foreground/40">{filtered.length} van {projects?.length} projecten</span>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="text-[11px] font-medium text-[hsl(var(--tenant-primary))] flex items-center gap-1 hover:opacity-80 transition-opacity">
                  <X className="h-3 w-3" /> Filters wissen
                </button>
              )}
            </div>
            <div className="ios-group overflow-hidden divide-y divide-border/20">
              {filtered.map(p => (
                <button key={p.id} onClick={() => navigate(`/projects/${p.id}`)}
                  className="w-full flex items-center gap-3 px-4 py-3 transition-colors text-left active:bg-foreground/[0.02]">
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
            {filtered.length === 0 && hasActiveFilters && (
              <p className="text-sm text-muted-foreground/40 text-center py-8">Geen projecten gevonden</p>
            )}
          </>
        )}
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════ */
  /* DESKTOP                                                 */
  /* ═══════════════════════════════════════════════════════ */
  return (
    <div className="animate-fade-in">
      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-display font-extrabold tracking-tight text-foreground">Projecten</h1>
          <p className="text-[13px] text-muted-foreground/50 mt-0.5">Beheer meet- en inspectieprojecten</p>
        </div>
        <Button onClick={() => navigate('/projects/new')} className="rounded-xl h-10 px-5 font-semibold text-[13px] shadow-sm">
          <Plus className="mr-1.5 h-4 w-4" /> Nieuw project
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>
      ) : projects?.length === 0 ? (
        <EmptyState icon={FolderKanban} title="Nog geen projecten" description="Maak uw eerste project aan om veldwerk te organiseren."
          action={<Button variant="outline" onClick={() => navigate('/projects/new')} className="rounded-xl"><Plus className="mr-2 h-4 w-4" /> Project aanmaken</Button>}
        />
      ) : (
        <>
          {/* ── Quick stats ── */}
          <div className="flex items-center gap-5 mb-5">
            <div className="flex items-center gap-2 text-[12px]">
              <div className="w-2 h-2 rounded-full bg-primary/40" />
              <span className="text-muted-foreground/50 font-medium">{plannedCount} gepland</span>
            </div>
            <div className="flex items-center gap-2 text-[12px]">
              <div className="w-2 h-2 rounded-full bg-emerald-500/50" />
              <span className="text-muted-foreground/50 font-medium">{completedCount} afgerond</span>
            </div>
            {overdueCount > 0 && (
              <div className="flex items-center gap-1.5 text-[12px]">
                <AlertTriangle className="h-3 w-3 text-destructive/60" />
                <span className="text-destructive/70 font-semibold">{overdueCount} achterstallig</span>
              </div>
            )}
          </div>

          {/* ── Toolbar ── */}
          <div className="bg-card rounded-xl border border-border/50 shadow-sm mb-0.5">
            <div className="flex items-center gap-3 px-4 py-3">
              {/* Search */}
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Zoek op naam, nummer, adres of klant…"
                  className="pl-9 h-9 bg-muted/30 border-border/30 rounded-lg text-[13px] placeholder:text-muted-foreground/30 focus:bg-card"
                />
              </div>

              {/* Divider */}
              <div className="w-px h-6 bg-border/30" />

              {/* Filters */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[120px] h-9 rounded-lg border-border/30 bg-muted/20 text-[12px] font-medium">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle status</SelectItem>
                  <SelectItem value="planned">Gepland</SelectItem>
                  <SelectItem value="completed">Afgerond</SelectItem>
                </SelectContent>
              </Select>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-[120px] h-9 rounded-lg border-border/30 bg-muted/20 text-[12px] font-medium">
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
              {technicians && technicians.length > 0 && (
                <Select value={techFilter} onValueChange={setTechFilter}>
                  <SelectTrigger className="w-[140px] h-9 rounded-lg border-border/30 bg-muted/20 text-[12px] font-medium">
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

              {/* Results + clear */}
              <div className="ml-auto flex items-center gap-3">
                <span className="text-[11px] text-muted-foreground/35 tabular-nums font-medium">
                  {filtered.length} van {projects?.length}
                </span>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="text-[11px] font-semibold text-primary flex items-center gap-1 hover:opacity-80 transition-opacity">
                    <X className="h-3 w-3" /> Wissen
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ── Table ── */}
          <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/40 bg-muted/20">
                  <th className="text-left text-[10px] font-bold text-muted-foreground/45 px-5 py-3 uppercase tracking-[0.08em] w-[100px]">Nummer</th>
                  <th className="text-left text-[10px] font-bold text-muted-foreground/45 px-5 py-3 uppercase tracking-[0.08em]">Project</th>
                  <th className="text-left text-[10px] font-bold text-muted-foreground/45 px-5 py-3 uppercase tracking-[0.08em]">Locatie</th>
                  <th className="text-left text-[10px] font-bold text-muted-foreground/45 px-5 py-3 uppercase tracking-[0.08em] w-[110px]">Datum</th>
                  <th className="text-left text-[10px] font-bold text-muted-foreground/45 px-5 py-3 uppercase tracking-[0.08em]">Klant</th>
                  <th className="text-left text-[10px] font-bold text-muted-foreground/45 px-5 py-3 uppercase tracking-[0.08em]">Monteur</th>
                  <th className="text-left text-[10px] font-bold text-muted-foreground/45 px-5 py-3 uppercase tracking-[0.08em] w-[100px]">Status</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => {
                  const isOverdue = (() => {
                    if (p.status !== 'planned' || !p.planned_date) return false;
                    try { const d = parseISO(p.planned_date); return isPast(d) && !isToday(d); } catch { return false; }
                  })();

                  return (
                    <tr key={p.id}
                      className={cn(
                        'group cursor-pointer transition-colors hover:bg-muted/30',
                        i < filtered.length - 1 && 'border-b border-border/20',
                      )}
                      onClick={() => navigate(`/projects/${p.id}`)}>
                      <td className="px-5 py-3.5">
                        <span className="text-[12px] font-mono text-muted-foreground/40 tabular-nums">{p.project_number}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-[13px] font-semibold text-foreground">{p.project_name}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-[12px] text-muted-foreground/50">
                          {p.city || '—'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={cn(
                          'text-[12px] tabular-nums',
                          isOverdue ? 'text-destructive/70 font-semibold' : 'text-muted-foreground/50',
                        )}>{formatNlDate(p.planned_date)}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-[12px] text-muted-foreground/50">{p.clients?.company_name || '—'}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-[12px] text-muted-foreground/50">{p.technicians?.full_name || '—'}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusPill status={p.status} overdue={isOverdue} />
                      </td>
                      <td className="pr-4 py-3.5">
                        <ChevronRight className="h-4 w-4 text-muted-foreground/15 group-hover:text-muted-foreground/40 transition-colors" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filtered.length === 0 && hasActiveFilters && (
              <div className="py-14 flex flex-col items-center gap-2">
                <Search className="h-5 w-5 text-muted-foreground/20" />
                <p className="text-[13px] text-muted-foreground/40">Geen projecten gevonden</p>
                <button onClick={clearFilters} className="text-[12px] font-medium text-primary hover:opacity-80 transition-opacity mt-1">
                  Filters wissen
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* ── Status components ── */

function StatusDot({ status }: { status: string }) {
  return (
    <span className={cn(
      'w-[6px] h-[6px] rounded-full',
      status === 'completed' ? 'bg-[hsl(var(--status-completed))]' : 'bg-[hsl(var(--status-planned)/0.4)]'
    )} />
  );
}

function StatusPill({ status, overdue = false }: { status: string; overdue?: boolean }) {
  if (overdue) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-destructive/8 text-destructive/80 text-[11px] font-semibold">
        <span className="w-1.5 h-1.5 rounded-full bg-destructive/60" />
        Achterstallig
      </span>
    );
  }
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold',
      status === 'completed'
        ? 'bg-emerald-500/8 text-emerald-600/80'
        : 'bg-primary/6 text-primary/70',
    )}>
      <span className={cn(
        'w-1.5 h-1.5 rounded-full',
        status === 'completed' ? 'bg-emerald-500/50' : 'bg-primary/40',
      )} />
      {status === 'completed' ? 'Afgerond' : 'Gepland'}
    </span>
  );
}
