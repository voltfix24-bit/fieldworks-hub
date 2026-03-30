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
      <div className="flex items-end justify-between mb-7">
        <div>
          <h1 className="text-[22px] font-display font-extrabold tracking-tight text-foreground leading-none">Projecten</h1>
          <div className="flex items-center gap-4 mt-2">
            <p className="text-[13px] text-muted-foreground/50">Beheer meet- en inspectieprojecten</p>
            <div className="w-px h-3.5 bg-border/30" />
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground/45 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                {plannedCount} gepland
              </span>
              <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground/45 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--status-completed))]/60" />
                {completedCount} afgerond
              </span>
              {overdueCount > 0 && (
                <span className="flex items-center gap-1 text-[11px] text-destructive/70 font-semibold">
                  <AlertTriangle className="h-3 w-3" />
                  {overdueCount} achterstallig
                </span>
              )}
            </div>
          </div>
        </div>
        <Button onClick={() => navigate('/projects/new')} className="rounded-lg h-10 px-5 font-bold text-[13px] tracking-wide shadow-[0_2px_8px_hsl(var(--primary)/0.2)]">
          <Plus className="mr-1.5 h-4 w-4" /> NIEUW PROJECT
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>
      ) : projects?.length === 0 ? (
        <EmptyState icon={FolderKanban} title="Nog geen projecten" description="Maak uw eerste project aan om veldwerk te organiseren."
          action={<Button variant="outline" onClick={() => navigate('/projects/new')} className="rounded-xl"><Plus className="mr-2 h-4 w-4" /> Project aanmaken</Button>}
        />
      ) : (
        <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
          {/* ── Integrated toolbar ── */}
          <div className="flex items-center gap-3 px-5 py-3 border-b border-border/40 bg-muted/15">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/30" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Zoeken…"
                className="pl-9 h-8 bg-card border-border/30 rounded-lg text-[12px] placeholder:text-muted-foreground/30 focus:ring-1 focus:ring-primary/20"
              />
            </div>

            <div className="w-px h-5 bg-border/25" />

            <div className="flex items-center gap-1.5">
              {(['all', 'planned', 'completed'] as const).map(s => (
                <button key={s} onClick={() => setStatusFilter(s === statusFilter ? 'all' : s)}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all',
                    statusFilter === s
                      ? 'bg-foreground/8 text-foreground shadow-sm'
                      : 'text-muted-foreground/40 hover:text-muted-foreground/60 hover:bg-muted/30',
                  )}>
                  {s === 'all' ? 'Alle' : s === 'planned' ? 'Gepland' : 'Afgerond'}
                </button>
              ))}
            </div>

            <div className="w-px h-5 bg-border/25" />

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[110px] h-8 rounded-lg border-border/25 bg-transparent text-[11px] font-medium">
                <SelectValue placeholder="Periode" />
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
                <SelectTrigger className="w-[130px] h-8 rounded-lg border-border/25 bg-transparent text-[11px] font-medium">
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

            <div className="ml-auto flex items-center gap-3">
              <span className="text-[10px] text-muted-foreground/30 tabular-nums font-medium">
                {filtered.length}{filtered.length !== (projects?.length ?? 0) ? ` / ${projects?.length}` : ''} projecten
              </span>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="text-[10px] font-semibold text-primary flex items-center gap-0.5 hover:opacity-80 transition-opacity">
                  <X className="h-3 w-3" /> Reset
                </button>
              )}
            </div>
          </div>

          {/* ── Table ── */}
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/30">
                <th className="text-left text-[10px] font-bold text-muted-foreground/40 px-5 py-2.5 uppercase tracking-[0.08em] w-[90px]">Nr.</th>
                <th className="text-left text-[10px] font-bold text-muted-foreground/40 px-5 py-2.5 uppercase tracking-[0.08em]">Projectnaam</th>
                <th className="text-left text-[10px] font-bold text-muted-foreground/40 px-5 py-2.5 uppercase tracking-[0.08em] w-[140px]">Locatie</th>
                <th className="text-left text-[10px] font-bold text-muted-foreground/40 px-5 py-2.5 uppercase tracking-[0.08em] w-[100px]">Datum</th>
                <th className="text-left text-[10px] font-bold text-muted-foreground/40 px-5 py-2.5 uppercase tracking-[0.08em] w-[150px]">Klant</th>
                <th className="text-left text-[10px] font-bold text-muted-foreground/40 px-5 py-2.5 uppercase tracking-[0.08em] w-[130px]">Monteur</th>
                <th className="text-left text-[10px] font-bold text-muted-foreground/40 px-5 py-2.5 uppercase tracking-[0.08em] w-[110px]">Status</th>
                <th className="w-8" />
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
                      'group cursor-pointer transition-colors',
                      'hover:bg-primary/[0.02]',
                      i < filtered.length - 1 && 'border-b border-border/15',
                      isOverdue && 'bg-destructive/[0.015]',
                    )}
                    onClick={() => navigate(`/projects/${p.id}`)}>
                    <td className="px-5 py-3">
                      <span className="text-[11px] font-mono text-muted-foreground/35 tabular-nums">{p.project_number}</span>
                    </td>
                    <td className="px-5 py-3">
                      <div>
                        <span className="text-[13px] font-semibold text-foreground leading-tight">{p.project_name}</span>
                        {p.site_name && (
                          <span className="block text-[10px] text-muted-foreground/30 mt-0.5 truncate">{p.site_name}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      {p.city ? (
                        <span className="text-[12px] text-muted-foreground/50 flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground/25 shrink-0" />
                          {p.city}
                        </span>
                      ) : (
                        <span className="text-[11px] text-muted-foreground/20">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span className={cn(
                        'text-[11px] tabular-nums',
                        isOverdue ? 'text-destructive/70 font-semibold' : 'text-muted-foreground/45',
                      )}>{formatNlDate(p.planned_date)}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-[12px] text-muted-foreground/45 truncate block">{p.clients?.company_name || <span className="text-muted-foreground/20">—</span>}</span>
                    </td>
                    <td className="px-5 py-3">
                      {p.technicians?.full_name ? (
                        <span className="text-[12px] text-muted-foreground/45 flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-muted/60 flex items-center justify-center text-[9px] font-bold text-muted-foreground/50 shrink-0">
                            {p.technicians.full_name[0]}
                          </span>
                          <span className="truncate">{p.technicians.full_name}</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-muted-foreground/20">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <StatusPill status={p.status} overdue={isOverdue} />
                    </td>
                    <td className="pr-4 py-3">
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/12 group-hover:text-muted-foreground/35 transition-colors" />
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

          {/* Footer */}
          {filtered.length > 0 && (
            <div className="px-5 py-2.5 border-t border-border/20 bg-muted/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/30" /> Gepland
                </span>
                <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--status-completed))]/50" /> Afgerond
                </span>
                <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-destructive/40" /> Achterstallig
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground/25 tabular-nums">
                {filtered.length} resultaten
              </span>
            </div>
          )}
        </div>
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
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-destructive/8 text-destructive text-[10px] font-bold tracking-wide">
        <span className="w-1.5 h-1.5 rounded-full bg-destructive/60 animate-pulse" />
        ACHTERSTALLIG
      </span>
    );
  }
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wide',
      status === 'completed'
        ? 'bg-[hsl(var(--status-completed))]/8 text-[hsl(var(--status-completed))]'
        : 'bg-primary/6 text-primary/70',
    )}>
      <span className={cn(
        'w-1.5 h-1.5 rounded-full',
        status === 'completed' ? 'bg-[hsl(var(--status-completed))]/60' : 'bg-primary/40',
      )} />
      {status === 'completed' ? 'AFGEROND' : 'GEPLAND'}
    </span>
  );
}
