import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProjects, type ProjectWithRelations } from '@/hooks/use-projects';
import { useTechnicians } from '@/hooks/use-technicians';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatNlDate, formatNlDateCompact } from '@/lib/nl-date';
import { cn } from '@/lib/utils';
import { FolderKanban, Plus, Calendar, MapPin, ChevronRight, X, Search, AlertTriangle, User } from 'lucide-react';
import { isToday, isThisWeek, isThisMonth, isPast, parseISO, format } from 'date-fns';
import { nl } from 'date-fns/locale';
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
    return <MobileProjectsView
      projects={projects ?? []}
      isLoading={isLoading}
      search={search}
      onSearchChange={setSearch}
      onNavigate={navigate}
    />;
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

/* ═══════════════════════════════════════════════════════ */
/* MOBILE WORK HUB                                         */
/* ═══════════════════════════════════════════════════════ */

type MobileTab = 'active' | 'completed';

function MobileProjectsView({
  projects, isLoading, search, onSearchChange, onNavigate,
}: {
  projects: ProjectWithRelations[];
  isLoading: boolean;
  search: string;
  onSearchChange: (v: string) => void;
  onNavigate: (path: string) => void;
}) {
  const [tab, setTab] = useState<MobileTab>('active');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects.filter(p => {
      if (tab === 'active' && p.status === 'completed') return false;
      if (tab === 'completed' && p.status !== 'completed') return false;
      if (!q) return true;
      return [p.project_number, p.project_name, p.site_name, p.address_line_1, p.city, p.clients?.company_name]
        .filter(Boolean).some(f => f!.toLowerCase().includes(q));
    });
  }, [projects, tab, search]);

  const groups = useMemo(() => {
    const map = new Map<string, { label: string; sortKey: string; items: ProjectWithRelations[] }>();
    for (const p of filtered) {
      const raw = p.planned_date || p.created_at;
      let key = 'geen-datum';
      let label = 'Geen datum';
      let sortKey = '0000-00';
      if (raw) {
        try {
          const d = parseISO(raw);
          key = format(d, 'yyyy-MM');
          label = format(d, 'LLLL yyyy', { locale: nl });
          label = label.charAt(0).toUpperCase() + label.slice(1);
          sortKey = key;
        } catch { /* ignore */ }
      }
      if (!map.has(key)) map.set(key, { label, sortKey, items: [] });
      map.get(key)!.items.push(p);
    }
    return Array.from(map.values()).sort((a, b) => b.sortKey.localeCompare(a.sortKey));
  }, [filtered]);

  const activeCount = projects.filter(p => p.status !== 'completed').length;
  const completedCount = projects.filter(p => p.status === 'completed').length;

  return (
    <div className="animate-fade-in w-full max-w-full min-w-0">
      <PageHeader
        title="Projecten"
        action={<Button size="sm" onClick={() => onNavigate('/projects/new')} className="rounded-xl"><Plus className="mr-1.5 h-4 w-4" /> Nieuw</Button>}
      />

      {isLoading ? (
        <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>
      ) : projects.length === 0 ? (
        <EmptyState icon={FolderKanban} title="Nog geen projecten" description="Maak uw eerste project aan."
          action={<Button variant="outline" onClick={() => onNavigate('/projects/new')} className="rounded-xl"><Plus className="mr-2 h-4 w-4" /> Project aanmaken</Button>}
        />
      ) : (
        <>
          {/* Search */}
          <div className="relative w-full mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30" />
            <Input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Zoek op naam, nummer, adres of klant…"
              className="w-full pl-9 h-10 text-[13px] border-border/30 bg-card rounded-xl"
            />
          </div>

          {/* Tabs */}
          <div className="flex gap-1.5 mb-4 w-full max-w-full overflow-x-auto no-scrollbar">
            <MobileTabChip label="Actief" count={activeCount} active={tab === 'active'} onClick={() => setTab('active')} />
            <MobileTabChip label="Afgerond" count={completedCount} active={tab === 'completed'} onClick={() => setTab('completed')} />
          </div>

          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground/40 text-center py-10">Geen projecten gevonden</p>
          ) : (
            <div className="flex flex-col gap-5">
              {groups.map(g => (
                <section key={g.label} className="w-full min-w-0">
                  <div className="flex items-baseline justify-between mb-2 px-1">
                    <h2 className="text-[13px] font-bold text-foreground/80 tracking-tight truncate">{g.label}</h2>
                    <span className="text-[11px] text-muted-foreground/40 tabular-nums shrink-0 ml-2">{g.items.length}</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {g.items.map(p => (
                      <MobileProjectCard key={p.id} project={p} onClick={() => onNavigate(`/projects/${p.id}`)} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function MobileTabChip({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'shrink-0 px-3.5 h-9 rounded-full text-[12px] font-semibold transition-colors flex items-center gap-1.5',
        active ? 'bg-foreground text-background' : 'bg-muted/40 text-muted-foreground/70 active:bg-muted/60',
      )}
    >
      <span>{label}</span>
      <span className={cn(
        'tabular-nums text-[11px] px-1.5 rounded-full',
        active ? 'bg-background/15 text-background' : 'bg-foreground/5 text-muted-foreground/60',
      )}>{count}</span>
    </button>
  );
}

function MobileProjectCard({ project: p, onClick }: { project: ProjectWithRelations; onClick: () => void }) {
  const isCompleted = p.status === 'completed';
  const isOverdue = !isCompleted && !!p.planned_date && (() => {
    try { const d = parseISO(p.planned_date!); return isPast(d) && !isToday(d); } catch { return false; }
  })();

  // Simple progress estimate (no extra queries)
  const progress = isCompleted ? 100 :
    (p.client_id ? 20 : 0) + (p.technician_id ? 20 : 0) + (p.equipment_id ? 20 : 0);

  // Status label heuristic (no extra queries)
  const statusLabel: { text: string; tone: 'idle' | 'busy' | 'ready' | 'done' | 'late' } =
    isCompleted ? { text: 'Afgerond', tone: 'done' } :
    isOverdue ? { text: 'Achterstallig', tone: 'late' } :
    progress >= 60 ? { text: 'Klaar om te starten', tone: 'ready' } :
    progress > 0 ? { text: 'In voorbereiding', tone: 'busy' } :
    { text: 'Nog te starten', tone: 'idle' };

  const toneClasses: Record<typeof statusLabel.tone, string> = {
    idle: 'bg-muted/50 text-muted-foreground/70',
    busy: 'bg-primary/10 text-primary',
    ready: 'bg-[hsl(var(--status-completed))]/12 text-[hsl(var(--status-completed))]',
    done: 'bg-[hsl(var(--status-completed))]/12 text-[hsl(var(--status-completed))]',
    late: 'bg-destructive/10 text-destructive',
  };

  const addressLine = [p.address_line_1, p.city].filter(Boolean).join(', ');

  return (
    <button
      onClick={onClick}
      className="w-full max-w-full min-w-0 text-left bg-card rounded-2xl border border-border/40 shadow-sm active:bg-foreground/[0.02] transition-colors p-3.5"
    >
      {/* Row 1: date + project# + status */}
      <div className="flex items-center gap-2 mb-1.5 min-w-0">
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground/60 shrink-0">
          <Calendar className="h-3 w-3" />
          {p.planned_date ? formatNlDateCompact(p.planned_date) : '—'}
        </span>
        <span className="text-[11px] font-mono text-muted-foreground/35 truncate">{p.project_number}</span>
        <span className={cn('ml-auto shrink-0 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md', toneClasses[statusLabel.tone])}>
          {statusLabel.text}
        </span>
      </div>

      {/* Row 2: project name */}
      <p className="text-[15px] font-semibold text-foreground leading-snug break-words">{p.project_name}</p>

      {/* Row 3: address */}
      {addressLine && (
        <p className="mt-0.5 text-[12px] text-muted-foreground/60 flex items-start gap-1 min-w-0">
          <MapPin className="h-3 w-3 mt-0.5 shrink-0 text-muted-foreground/40" />
          <span className="break-words min-w-0">{addressLine}</span>
        </p>
      )}

      {/* Row 4: technician */}
      <div className="mt-2 flex items-center gap-2 min-w-0">
        <User className="h-3 w-3 text-muted-foreground/40 shrink-0" />
        <span className="text-[12px] text-muted-foreground/70 truncate min-w-0">
          {p.technicians?.full_name || <span className="text-muted-foreground/40">Geen monteur toegewezen</span>}
        </span>
      </div>

      {/* Row 5: progress */}
      <div className="mt-2.5 flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-muted/50 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              isCompleted ? 'bg-[hsl(var(--status-completed))]' : progress >= 60 ? 'bg-primary' : 'bg-primary/60',
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-[10px] font-bold tabular-nums text-muted-foreground/60 shrink-0">{progress}%</span>
      </div>
    </button>
  );
}

