import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useTechnicians } from '@/hooks/use-technicians';
import { PageHeader } from '@/components/ui/page-header';
import { useProjects } from '@/hooks/use-projects';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Calendar as CalendarIcon, MapPin, FolderOpen, ChevronRight,
  List, ChevronLeft, LayoutGrid, Users, Clock, AlertTriangle,
} from 'lucide-react';
import {
  format, parseISO, isToday, isThisWeek,
  startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay,
  addMonths, subMonths, isSameMonth, isPast, isTomorrow,
} from 'date-fns';
import { nl } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type ViewMode = 'list' | 'calendar' | 'monteurs';

export default function PlanningPage() {
  const navigate = useNavigate();
  const { data: projects = [] } = useProjects();
  const { data: technicians = [] } = useTechnicians();
  const isMobile = useIsMobile();
  const [searchParams] = useSearchParams();
  const [view, setView] = useState<ViewMode>(
    searchParams.get('view') === 'kalender' ? 'calendar' : 'list'
  );
  const [calMonth, setCalMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const planned = useMemo(() =>
    projects
      .filter(p => p.status === 'planned' && p.planned_date)
      .sort((a, b) => (a.planned_date || '').localeCompare(b.planned_date || '')),
    [projects],
  );

  const todayProjects = planned.filter(p => { try { return isToday(parseISO(p.planned_date!)); } catch { return false; } });
  const weekProjects = planned.filter(p => { try { const d = parseISO(p.planned_date!); return !isToday(d) && isThisWeek(d, { weekStartsOn: 1 }); } catch { return false; } });
  const laterProjects = planned.filter(p => { try { const d = parseISO(p.planned_date!); return !isToday(d) && !isThisWeek(d, { weekStartsOn: 1 }); } catch { return false; } });

  const projectenPerMonteur = useMemo(() => {
    const map = new Map<string, { tech: any; projecten: typeof planned }>();
    planned.forEach(p => {
      if (!p.technician_id) return;
      if (!map.has(p.technician_id)) {
        map.set(p.technician_id, { tech: p.technicians, projecten: [] });
      }
      map.get(p.technician_id)!.projecten.push(p);
    });
    return Array.from(map.values());
  }, [planned]);

  const calDays = useMemo(() => eachDayOfInterval({ start: startOfMonth(calMonth), end: endOfMonth(calMonth) }), [calMonth]);
  const projectsByDate = useMemo(() => {
    const map = new Map<string, typeof planned>();
    planned.forEach(p => { const key = p.planned_date!; if (!map.has(key)) map.set(key, []); map.get(key)!.push(p); });
    return map;
  }, [planned]);

  const firstDayOffset = (getDay(startOfMonth(calMonth)) + 6) % 7;
  const selectedDateKey = format(selectedDate, 'yyyy-MM-dd');
  const selectedProjects = projectsByDate.get(selectedDateKey) || [];

  const getSelectedDateLabel = () => {
    if (isToday(selectedDate)) return 'Vandaag';
    if (isTomorrow(selectedDate)) return 'Morgen';
    return format(selectedDate, 'EEEE d MMMM', { locale: nl });
  };

  // Stats for the month
  const monthProjectCount = useMemo(() => {
    return planned.filter(p => {
      try { const d = parseISO(p.planned_date!); return isSameMonth(d, calMonth); } catch { return false; }
    }).length;
  }, [planned, calMonth]);

  const overdueCount = useMemo(() => {
    return planned.filter(p => {
      try { const d = parseISO(p.planned_date!); return isPast(d) && !isToday(d); } catch { return false; }
    }).length;
  }, [planned]);

  if (isMobile) {
    return (
      <div className="ios-planning animate-fade-in">
        {/* Header */}
        <div className="ios-planning-header">
          <h1 className="ios-planning-title">Planning</h1>

          {/* Segment control */}
          <div className="ios-planning-segment">
            <button
              onClick={() => setView('list')}
              className={cn('ios-planning-seg-btn', view === 'list' && 'active')}
            >
              <List className="h-3.5 w-3.5" />
              Lijst
            </button>
            <button
              onClick={() => setView('calendar')}
              className={cn('ios-planning-seg-btn', view === 'calendar' && 'active')}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              Kalender
            </button>
            <button
              onClick={() => setView('monteurs')}
              className={cn('ios-planning-seg-btn', view === 'monteurs' && 'active')}
            >
              <Users className="h-3.5 w-3.5" />
              Monteurs
            </button>
          </div>
        </div>

        {view === 'list' && (
          <div className="ios-planning-content">
            {todayProjects.length > 0 && (
              <PlanningGroup title="Vandaag" items={todayProjects} navigate={navigate} />
            )}
            {weekProjects.length > 0 && (
              <PlanningGroup title="Deze week" items={weekProjects} navigate={navigate} />
            )}
            {laterProjects.length > 0 && (
              <PlanningGroup title="Later" items={laterProjects} navigate={navigate} />
            )}
            {planned.length === 0 && (
              <div className="ios-planning-empty">
                <span className="ios-planning-empty-icon">📋</span>
                <p>Geen geplande projecten</p>
              </div>
            )}
          </div>
        )}

        {view === 'calendar' && (
          <div className="ios-planning-content">
            {/* Calendar card */}
            <div className="ios-cal-card">
              {/* Month nav */}
              <div className="ios-cal-month-nav">
                <button
                  className="ios-cal-nav-arrow"
                  onClick={() => setCalMonth(m => subMonths(m, 1))}
                >
                  <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                </button>
                <button
                  onClick={() => { setCalMonth(new Date()); setSelectedDate(new Date()); }}
                  className="ios-cal-month-label"
                >
                  {format(calMonth, 'MMMM yyyy', { locale: nl })}
                </button>
                <button
                  className="ios-cal-nav-arrow"
                  onClick={() => setCalMonth(m => addMonths(m, 1))}
                >
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>

              {/* Day headers */}
              <div className="ios-cal-day-headers">
                {['MA', 'DI', 'WO', 'DO', 'VR', 'ZA', 'ZO'].map(d => (
                  <div key={d} className="ios-cal-day-header">{d}</div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="ios-cal-grid">
                {Array.from({ length: firstDayOffset }).map((_, i) => (
                  <div key={`e-${i}`} className="ios-cal-cell" />
                ))}
                {calDays.map(day => {
                  const dateKey = format(day, 'yyyy-MM-dd');
                  const dayProjects = projectsByDate.get(dateKey) || [];
                  const today = isToday(day);
                  const selected = isSameDay(day, selectedDate);
                  const hasProjects = dayProjects.length > 0;
                  const past = isPast(day) && !today;
                  const isWeekend = [0, 6].includes(day.getDay());

                  return (
                    <button
                      key={dateKey}
                      onClick={() => setSelectedDate(day)}
                      className="ios-cal-cell"
                    >
                      <span className={cn(
                        'ios-cal-day-num',
                        today && 'today',
                        selected && !today && 'selected',
                        today && selected && 'today selected',
                        !today && !selected && past && 'past',
                        !today && !selected && isWeekend && 'weekend',
                      )}>
                        {format(day, 'd')}
                      </span>
                      <div className="ios-cal-event-dots">
                        {hasProjects && (() => {
                          const heeftAchterstallig = dayProjects.some(dp => {
                            try { return dp.status === 'planned' && isPast(parseISO(dp.planned_date!)) && !isToday(parseISO(dp.planned_date!)); } catch { return false; }
                          });
                          const heeftGepland = dayProjects.some(dp => dp.status === 'planned') && !heeftAchterstallig;
                          const heeftAfgerond = dayProjects.some(dp => dp.status === 'completed');
                          return (
                            <>
                              {heeftAchterstallig && <span className="ios-cal-event-dot red" />}
                              {heeftGepland && <span className="ios-cal-event-dot" />}
                              {heeftAfgerond && <span className="ios-cal-event-dot green" />}
                            </>
                          );
                        })()}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Day detail */}
            <div className="ios-cal-day-detail">
              <div className="ios-cal-day-detail-header">
                <span className="ios-cal-day-detail-title">{getSelectedDateLabel()}</span>
                {selectedProjects.length > 0 && (
                  <span className="ios-cal-day-detail-count">
                    {selectedProjects.length} project{selectedProjects.length !== 1 ? 'en' : ''}
                  </span>
                )}
              </div>

              {selectedProjects.length > 0 ? (
                <div className="ios-dash-card">
                  {selectedProjects.map((p, i) => (
                    <div key={p.id}>
                      <PlanningProjectRow project={p} onClick={() => navigate(`/projects/${p.id}`)} />
                      {i < selectedProjects.length - 1 && <div className="ios-dash-row-divider" />}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="ios-planning-empty-day">
                  <span className="ios-planning-empty-icon">📋</span>
                  <p>Geen projecten gepland</p>
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'monteurs' && (
          <div className="ios-planning-content">
            {projectenPerMonteur.length === 0 ? (
              <div className="ios-planning-empty">
                <span className="ios-planning-empty-icon">👷</span>
                <p>Geen geplande projecten</p>
              </div>
            ) : (
              projectenPerMonteur.map(({ tech, projecten }) => (
                <div key={tech?.full_name || 'unknown'} className="mb-4">
                  <div className="flex items-center gap-3 px-4 py-2">
                    <div className="w-8 h-8 rounded-full bg-[hsl(var(--tenant-primary)/0.1)] flex items-center justify-center">
                      <span className="text-[12px] font-bold text-[hsl(var(--tenant-primary))]">
                        {tech?.full_name?.[0] || '?'}
                      </span>
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-foreground">{tech?.full_name || 'Onbekend'}</p>
                      <p className="text-[11px] text-muted-foreground/40">{projecten.length} project{projecten.length !== 1 ? 'en' : ''} gepland</p>
                    </div>
                  </div>
                  <div className="ios-dash-card">
                    {projecten.slice(0, 5).map((p, i) => (
                      <div key={p.id}>
                        <PlanningProjectRow project={p} onClick={() => navigate(`/projects/${p.id}`)} />
                        {i < Math.min(projecten.length, 5) - 1 && <div className="ios-dash-row-divider" />}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════
  // DESKTOP
  // ═══════════════════════════════════════════════════════

  const renderGroup = (title: string, items: typeof planned) => {
    if (items.length === 0) return null;
    return (
      <section className="space-y-2">
        <p className="text-[11px] uppercase tracking-[0.08em] font-semibold text-muted-foreground/50 px-0.5">{title}</p>
        <div className="space-y-1.5">
          {items.map(p => <DesktopProjectRow key={p.id} project={p} onClick={() => navigate(`/projects/${p.id}`)} />)}
        </div>
      </section>
    );
  };

  return (
    <div className="animate-fade-in">
      {/* ── Header with segment control + stats ── */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-[22px] font-display font-extrabold tracking-tight text-foreground">Planning</h1>
          <p className="text-[13px] text-muted-foreground/50 mt-0.5">Geplande projecten en meetafspraken</p>
        </div>
        <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1 border border-border/50">
          {([
            { key: 'list' as ViewMode, label: 'Lijst', icon: List },
            { key: 'calendar' as ViewMode, label: 'Kalender', icon: LayoutGrid },
            { key: 'monteurs' as ViewMode, label: 'Monteurs', icon: Users },
          ]).map(tab => (
            <button key={tab.key} onClick={() => setView(tab.key)} className={cn(
              'flex items-center gap-1.5 rounded-md px-4 py-2 text-[12px] font-semibold transition-all',
              view === tab.key
                ? 'bg-card text-foreground shadow-sm border border-border/60'
                : 'text-muted-foreground/50 hover:text-muted-foreground/80'
            )}>
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {view === 'list' && (
        <div className="space-y-6">
          {renderGroup('Vandaag', todayProjects)}
          {renderGroup('Deze week', weekProjects)}
          {renderGroup('Later', laterProjects)}
          {planned.length === 0 && (
            <div className="text-center py-16">
              <CalendarIcon className="h-6 w-6 text-muted-foreground/15 mx-auto mb-2" />
              <p className="text-[13px] text-muted-foreground/40">Geen geplande projecten</p>
            </div>
          )}
        </div>
      )}

      {view === 'calendar' && (
        <div className="grid grid-cols-12 gap-5">
          {/* ── Calendar — left 7 cols ── */}
          <div className="col-span-7">
            <div className="bg-card rounded-xl border border-border/60 shadow-sm overflow-hidden">
              {/* Month header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/50 bg-muted/20">
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-muted/60" onClick={() => setCalMonth(m => subMonths(m, 1))}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-muted/60" onClick={() => setCalMonth(m => addMonths(m, 1))}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <button onClick={() => { setCalMonth(new Date()); setSelectedDate(new Date()); }}
                  className="text-[16px] font-display font-extrabold text-foreground capitalize hover:text-primary transition-colors">
                  {format(calMonth, 'MMMM yyyy', { locale: nl })}
                </button>
                <div className="flex items-center gap-3">
                  {overdueCount > 0 && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-destructive">
                      <AlertTriangle className="h-3 w-3" />
                      {overdueCount} achterstallig
                    </span>
                  )}
                  <span className="text-[11px] text-muted-foreground/60 font-medium tabular-nums">
                    {monthProjectCount} deze maand
                  </span>
                </div>
              </div>

              {/* Weekday headers */}
              <div className="grid grid-cols-7 border-b border-border/30">
                {['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'].map((d, i) => (
                  <div key={d} className={cn(
                    'text-center text-[11px] uppercase tracking-wider font-bold py-2.5',
                    i >= 5 ? 'text-muted-foreground/25' : 'text-muted-foreground/45'
                  )}>{d}</div>
                ))}
              </div>

              {/* Day grid */}
              <div className="grid grid-cols-7">
                {Array.from({ length: firstDayOffset }).map((_, i) => (
                  <div key={`e-${i}`} className="aspect-[1.2] border-b border-r border-border/15" />
                ))}
                {calDays.map((day, idx) => {
                  const dateKey = format(day, 'yyyy-MM-dd');
                  const dayProjects = projectsByDate.get(dateKey) || [];
                  const today = isToday(day);
                  const selected = isSameDay(day, selectedDate);
                  const hasProjects = dayProjects.length > 0;
                  const past = isPast(day) && !today;
                  const isWeekend = [0, 6].includes(day.getDay());
                  const isOverdue = dayProjects.some(dp => {
                    try { return dp.status === 'planned' && isPast(parseISO(dp.planned_date!)) && !isToday(parseISO(dp.planned_date!)); } catch { return false; }
                  });
                  const colIdx = (firstDayOffset + idx) % 7;

                  return (
                    <button key={dateKey} onClick={() => setSelectedDate(day)}
                      className={cn(
                        'aspect-[1.2] flex flex-col items-start p-2 relative transition-all border-b border-r border-border/15',
                        selected && 'bg-primary/5 border-primary/20 z-10',
                        !selected && today && 'bg-accent/30',
                        !selected && !today && 'hover:bg-muted/30',
                        colIdx === 6 && 'border-r-0',
                      )}>
                      {/* Day number */}
                      <span className={cn(
                        'text-[13px] leading-none w-7 h-7 flex items-center justify-center rounded-lg font-semibold transition-colors',
                        selected && today && 'bg-primary text-primary-foreground font-extrabold',
                        selected && !today && 'bg-primary/10 text-primary font-bold',
                        !selected && today && 'text-primary font-extrabold',
                        !selected && !today && past && 'text-muted-foreground/25',
                        !selected && !today && !past && isWeekend && 'text-muted-foreground/35',
                        !selected && !today && !past && !isWeekend && 'text-foreground/70',
                      )}>{format(day, 'd')}</span>

                      {/* Activity indicators */}
                      {hasProjects && (
                        <div className="mt-auto w-full space-y-0.5">
                          {dayProjects.slice(0, 2).map((dp, i) => (
                            <div key={i} className={cn(
                              'w-full h-[5px] rounded-sm',
                              isOverdue ? 'bg-destructive/50' : 'bg-primary/30',
                              selected && !isOverdue && 'bg-primary/50',
                            )} />
                          ))}
                          {dayProjects.length > 2 && (
                            <span className={cn(
                              'text-[9px] font-bold tabular-nums',
                              isOverdue ? 'text-destructive/60' : 'text-primary/40',
                            )}>+{dayProjects.length - 2}</span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Day detail — right 5 cols ── */}
          <div className="col-span-5">
            <div className="bg-card rounded-xl border border-border/60 shadow-sm overflow-hidden sticky top-6">
              {/* Detail header */}
              <div className="px-5 py-4 border-b border-border/50 bg-muted/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-[16px] font-display font-extrabold text-foreground capitalize">{getSelectedDateLabel()}</h3>
                    <p className="text-[11px] text-muted-foreground/45 mt-0.5 capitalize">
                      {format(selectedDate, 'EEEE d MMMM yyyy', { locale: nl })}
                    </p>
                  </div>
                  {selectedProjects.length > 0 && (
                    <div className="flex items-center gap-1.5 bg-primary/8 text-primary rounded-lg px-3 py-1.5">
                      <FolderOpen className="h-3.5 w-3.5" />
                      <span className="text-[12px] font-bold tabular-nums">{selectedProjects.length}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Content */}
              {selectedProjects.length === 0 ? (
                <div className="py-14 flex flex-col items-center gap-3 px-6">
                  <div className="w-12 h-12 rounded-xl bg-muted/40 flex items-center justify-center">
                    <CalendarIcon className="h-5 w-5 text-muted-foreground/25" />
                  </div>
                  <div className="text-center">
                    <p className="text-[13px] font-medium text-muted-foreground/50">Geen projecten</p>
                    <p className="text-[11px] text-muted-foreground/30 mt-0.5">
                      Er zijn geen projecten gepland op deze dag
                    </p>
                  </div>
                </div>
              ) : (
                <div>
                  {selectedProjects.map((p, i) => {
                    const isOverdue = (() => { try { return p.status === 'planned' && isPast(parseISO(p.planned_date!)) && !isToday(parseISO(p.planned_date!)); } catch { return false; } })();
                    return (
                      <button
                        key={p.id}
                        onClick={() => navigate(`/projects/${p.id}`)}
                        className={cn(
                          'w-full flex items-center gap-3.5 px-5 py-3.5 hover:bg-muted/30 transition-colors text-left group',
                          i < selectedProjects.length - 1 && 'border-b border-border/30',
                        )}
                      >
                        {/* Status bar */}
                        <div className={cn(
                          'w-1 h-10 rounded-full shrink-0',
                          isOverdue ? 'bg-destructive/60' : 'bg-primary/40',
                        )} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-foreground truncate">{p.project_name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[11px] text-muted-foreground/45 font-mono">{p.project_number}</span>
                            {p.city && (
                              <span className="text-[11px] text-muted-foreground/45 flex items-center gap-0.5">
                                <MapPin className="h-2.5 w-2.5" />{p.city}
                              </span>
                            )}
                            {isOverdue && (
                              <span className="text-[10px] font-semibold text-destructive flex items-center gap-0.5">
                                <AlertTriangle className="h-2.5 w-2.5" />Achterstallig
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground/15 shrink-0 group-hover:text-muted-foreground/40 transition-colors" />
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Quick stats footer */}
              <div className="px-5 py-3 border-t border-border/30 bg-muted/10 flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-sm bg-primary/40" />
                  <span className="text-[10px] text-muted-foreground/45 font-medium">Gepland</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-sm bg-destructive/50" />
                  <span className="text-[10px] text-muted-foreground/45 font-medium">Achterstallig</span>
                </div>
                <div className="ml-auto text-[10px] text-muted-foreground/30 font-medium tabular-nums">
                  {planned.length} totaal gepland
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {view === 'monteurs' && (
        <div className="space-y-4">
          {projectenPerMonteur.length === 0 ? (
            <div className="text-center py-16">
              <Users className="h-6 w-6 text-muted-foreground/15 mx-auto mb-2" />
              <p className="text-[13px] text-muted-foreground/40">Geen geplande projecten per monteur</p>
            </div>
          ) : (
            projectenPerMonteur.map(({ tech, projecten }) => (
              <div key={tech?.full_name || 'unknown'}>
                <div className="flex items-center gap-3 px-1 mb-2">
                  <div className="w-8 h-8 rounded-full bg-[hsl(var(--tenant-primary)/0.1)] flex items-center justify-center">
                    <span className="text-[12px] font-bold text-[hsl(var(--tenant-primary))]">{tech?.full_name?.[0] || '?'}</span>
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-foreground">{tech?.full_name || 'Onbekend'}</p>
                    <p className="text-[11px] text-muted-foreground/40">{projecten.length} project{projecten.length !== 1 ? 'en' : ''}</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {projecten.map(p => <DesktopProjectRow key={p.id} project={p} onClick={() => navigate(`/projects/${p.id}`)} />)}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/* ── Mobile components ── */

function PlanningGroup({ title, items, navigate }: { title: string; items: any[]; navigate: any }) {
  return (
    <section>
      <div className="ios-dash-section-header">
        <span className="ios-dash-section-title">{title}</span>
      </div>
      <div className="ios-dash-card">
        {items.map((p, i) => (
          <div key={p.id}>
            <PlanningProjectRow project={p} onClick={() => navigate(`/projects/${p.id}`)} />
            {i < items.length - 1 && <div className="ios-dash-row-divider" />}
          </div>
        ))}
      </div>
    </section>
  );
}

function PlanningProjectRow({ project: p, onClick }: { project: any; onClick: () => void }) {
  const today = p.planned_date ? isToday(parseISO(p.planned_date)) : false;

  return (
    <button onClick={onClick} className="ios-dash-project-row">
      <span className={cn(
        'ios-planning-accent',
        p.status === 'completed' ? 'green' : today ? 'today' : ''
      )} />
      <div className="ios-dash-project-info">
        <p className="ios-dash-project-name">{p.project_name}</p>
        <div className="ios-dash-project-meta">
          <span>{p.project_number}</span>
          {p.city && (
            <>
              <span>·</span>
              <MapPin className="h-2.5 w-2.5" />
              <span>{p.city}</span>
            </>
          )}
        </div>
      </div>
      <div className="ios-dash-project-right">
        {p.planned_date && (
          <span className="ios-dash-project-date">
            {format(parseISO(p.planned_date), 'd MMM', { locale: nl })}
          </span>
        )}
        <ChevronRight className="h-4 w-4 ios-dash-project-chevron" />
      </div>
    </button>
  );
}

/* ── Desktop project row ── */
function DesktopProjectRow({ project: p, onClick }: { project: any; onClick: () => void }) {
  const today = p.planned_date ? isToday(parseISO(p.planned_date)) : false;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 rounded-2xl bg-card px-4 py-3 transition-all text-left active:scale-[0.99]',
        today && 'ring-1 ring-[hsl(var(--tenant-primary)/0.12)]'
      )}
    >
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold text-foreground truncate leading-snug">{p.project_name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[11px] text-muted-foreground/45 font-mono">{p.project_number}</span>
          {p.city && <span className="text-[11px] text-muted-foreground/45 flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{p.city}</span>}
        </div>
      </div>
      <div className="flex items-center gap-2.5 shrink-0">
        {p.planned_date && (
          <span className="text-[11px] text-muted-foreground/35 tabular-nums">
            {format(parseISO(p.planned_date), 'd MMM', { locale: nl })}
          </span>
        )}
        <ChevronRight className="h-4 w-4 text-muted-foreground/15" />
      </div>
    </button>
  );
}
