import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { useProjects } from '@/hooks/use-projects';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Calendar as CalendarIcon, MapPin, FolderOpen, ChevronRight,
  List, ChevronLeft, LayoutGrid, Clock,
} from 'lucide-react';
import {
  format, parseISO, isToday, isThisWeek,
  startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay,
  addMonths, subMonths, isSameMonth, isPast, isTomorrow,
} from 'date-fns';
import { nl } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type ViewMode = 'list' | 'calendar';

export default function PlanningPage() {
  const navigate = useNavigate();
  const { data: projects = [] } = useProjects();
  const isMobile = useIsMobile();
  const [view, setView] = useState<ViewMode>('list');
  const [calMonth, setCalMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  /* ── Planned projects sorted ascending ── */
  const planned = useMemo(() =>
    projects
      .filter(p => p.status === 'planned' && p.planned_date)
      .sort((a, b) => (a.planned_date || '').localeCompare(b.planned_date || '')),
    [projects],
  );

  /* ── Temporal groups for list view ── */
  const todayProjects = planned.filter(p => {
    try { return isToday(parseISO(p.planned_date!)); } catch { return false; }
  });
  const weekProjects = planned.filter(p => {
    try {
      const d = parseISO(p.planned_date!);
      return !isToday(d) && isThisWeek(d, { weekStartsOn: 1 });
    } catch { return false; }
  });
  const laterProjects = planned.filter(p => {
    try {
      const d = parseISO(p.planned_date!);
      return !isToday(d) && !isThisWeek(d, { weekStartsOn: 1 });
    } catch { return false; }
  });

  /* ── Calendar data ── */
  const calDays = useMemo(() => {
    const start = startOfMonth(calMonth);
    const end = endOfMonth(calMonth);
    return eachDayOfInterval({ start, end });
  }, [calMonth]);

  const projectsByDate = useMemo(() => {
    const map = new Map<string, typeof planned>();
    planned.forEach(p => {
      const key = p.planned_date!;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(p);
    });
    return map;
  }, [planned]);

  /* offset for first day of month (Monday = 0) */
  const firstDayOffset = (getDay(startOfMonth(calMonth)) + 6) % 7;

  /* Selected date projects */
  const selectedDateKey = format(selectedDate, 'yyyy-MM-dd');
  const selectedProjects = projectsByDate.get(selectedDateKey) || [];

  /* Format selected date label */
  const getSelectedDateLabel = () => {
    if (isToday(selectedDate)) return 'Vandaag';
    if (isTomorrow(selectedDate)) return 'Morgen';
    return format(selectedDate, 'EEEE d MMMM', { locale: nl });
  };

  /* ── Render helpers ── */
  const renderGroup = (title: string, items: typeof planned, highlight?: boolean) => {
    if (items.length === 0) return null;
    return (
      <div className="space-y-1.5">
        <h3 className={cn(
          'text-[11px] uppercase tracking-widest font-semibold px-0.5',
          highlight ? 'text-[hsl(var(--tenant-primary,var(--primary))/0.7)]' : 'text-muted-foreground/60'
        )}>{title}</h3>
        <div className="space-y-1.5">
          {items.map(p => <ProjectRow key={p.id} project={p} isMobile={isMobile} onClick={() => navigate(`/projects/${p.id}`)} />)}
        </div>
      </div>
    );
  };

  return (
    <div className="animate-fade-in">
      <PageHeader title="Planning" description="Geplande projecten en meetafspraken" action={
        <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5">
          <button
            onClick={() => setView('list')}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition-all',
              view === 'list'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <List className="h-3.5 w-3.5" />
            Lijst
          </button>
          <button
            onClick={() => setView('calendar')}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition-all',
              view === 'calendar'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Kalender
          </button>
        </div>
      } />

      {/* ── LIST VIEW ── */}
      {view === 'list' && (
        <div className={cn(isMobile ? 'space-y-4' : 'space-y-6')}>
          {renderGroup('Vandaag', todayProjects, true)}
          {renderGroup('Deze week', weekProjects)}
          {renderGroup('Later', laterProjects)}
          {planned.length === 0 && <EmptyState />}
        </div>
      )}

      {/* ── CALENDAR VIEW ── */}
      {view === 'calendar' && (
        <div className="space-y-4">
          {/* Calendar card */}
          <div className="bg-card rounded-2xl border border-border/40 shadow-sm overflow-hidden">
            {/* Month navigation */}
            <div className="flex items-center justify-between px-4 py-3">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-muted/60"
                onClick={() => setCalMonth(m => subMonths(m, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <button
                onClick={() => { setCalMonth(new Date()); setSelectedDate(new Date()); }}
                className="text-[15px] font-semibold text-foreground capitalize hover:text-[hsl(var(--tenant-primary,var(--primary)))] transition-colors"
              >
                {format(calMonth, 'MMMM yyyy', { locale: nl })}
              </button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-muted/60"
                onClick={() => setCalMonth(m => addMonths(m, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 px-2">
              {['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'].map(d => (
                <div key={d} className="text-center text-[10px] uppercase tracking-wider font-semibold text-muted-foreground/40 py-2">
                  {d}
                </div>
              ))}
            </div>

            {/* Day grid */}
            <div className="grid grid-cols-7 px-2 pb-3">
              {/* Empty cells for offset */}
              {Array.from({ length: firstDayOffset }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}

              {calDays.map(day => {
                const dateKey = format(day, 'yyyy-MM-dd');
                const dayProjects = projectsByDate.get(dateKey) || [];
                const today = isToday(day);
                const selected = isSameDay(day, selectedDate);
                const hasProjects = dayProjects.length > 0;
                const inCurrentMonth = isSameMonth(day, calMonth);
                const past = isPast(day) && !today;

                return (
                  <button
                    key={dateKey}
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      'aspect-square flex flex-col items-center justify-center relative rounded-xl transition-all mx-0.5 my-0.5',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      selected && !today && 'bg-[hsl(var(--tenant-primary,var(--primary))/0.08)]',
                      selected && today && 'bg-[hsl(var(--tenant-primary,var(--primary)))]',
                      !selected && 'hover:bg-muted/40 active:scale-95',
                    )}
                  >
                    {/* Day number */}
                    <span className={cn(
                      'text-[13px] font-medium leading-none',
                      selected && today && 'text-primary-foreground font-semibold',
                      !selected && today && 'text-[hsl(var(--tenant-primary,var(--primary)))] font-semibold',
                      !today && !selected && past && 'text-muted-foreground/40',
                      !today && !selected && !past && 'text-foreground',
                      selected && !today && 'text-[hsl(var(--tenant-primary,var(--primary)))] font-semibold',
                    )}>
                      {format(day, 'd')}
                    </span>

                    {/* Indicator dots */}
                    {hasProjects && (
                      <div className="flex items-center gap-[3px] mt-1">
                        {dayProjects.slice(0, 3).map((_, i) => (
                          <div
                            key={i}
                            className={cn(
                              'w-[4px] h-[4px] rounded-full transition-colors',
                              selected && today
                                ? 'bg-primary-foreground/70'
                                : 'bg-[hsl(var(--tenant-primary,var(--primary))/0.5)]',
                            )}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Selected date detail panel ── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-0.5">
              <h3 className="text-[13px] font-semibold text-foreground capitalize">
                {getSelectedDateLabel()}
              </h3>
              {selectedProjects.length > 0 && (
                <span className="text-[11px] text-muted-foreground/50 font-medium">
                  {selectedProjects.length} {selectedProjects.length === 1 ? 'project' : 'projecten'}
                </span>
              )}
            </div>

            {selectedProjects.length === 0 ? (
              <div className="bg-card rounded-xl border border-border/30 py-8 flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-muted/40 flex items-center justify-center">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground/30" />
                </div>
                <p className="text-[12px] text-muted-foreground/50">
                  Geen projecten op deze dag
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {selectedProjects.map(p => (
                  <ProjectRow
                    key={p.id}
                    project={p}
                    isMobile={isMobile}
                    onClick={() => navigate(`/projects/${p.id}`)}
                    showFullDate={false}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Reusable project row ── */
function ProjectRow({ project: p, isMobile, onClick, showFullDate }: {
  project: any;
  isMobile: boolean;
  onClick: () => void;
  showFullDate?: boolean;
}) {
  const today = p.planned_date ? isToday(parseISO(p.planned_date)) : false;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 rounded-xl border bg-card hover:bg-muted/15 transition-all text-left active:scale-[0.998]',
        isMobile ? 'px-3 py-2.5 border-border/30' : 'px-3.5 py-3 border-border/40'
      )}
    >
      <div className={cn(
        'rounded-lg flex items-center justify-center shrink-0',
        isMobile ? 'w-8 h-8' : 'w-9 h-9',
        today
          ? 'bg-[hsl(var(--tenant-primary,var(--primary))/0.12)]'
          : 'bg-[hsl(var(--tenant-primary,var(--primary))/0.06)]'
      )}>
        <FolderOpen className={cn(
          isMobile ? 'h-3.5 w-3.5' : 'h-4 w-4',
          today
            ? 'text-[hsl(var(--tenant-primary,var(--primary))/0.7)]'
            : 'text-[hsl(var(--tenant-primary,var(--primary))/0.5)]'
        )} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-foreground truncate">{p.project_name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-muted-foreground/60 font-mono">{p.project_number}</span>
          {p.city && (
            <span className="text-[10px] text-muted-foreground/60 flex items-center gap-0.5">
              <MapPin className="h-2.5 w-2.5" />{p.city}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {p.planned_date && (
          <div className="flex flex-col items-end">
            {today && (
              <Badge variant="outline" className="text-[8px] px-1.5 py-0 h-4 border-[hsl(var(--tenant-primary,var(--primary))/0.3)] text-[hsl(var(--tenant-primary,var(--primary))/0.7)] mb-0.5">
                Vandaag
              </Badge>
            )}
            <span className="text-[11px] text-muted-foreground/60 tabular-nums font-medium">
              {showFullDate
                ? format(parseISO(p.planned_date), 'd MMMM', { locale: nl })
                : format(parseISO(p.planned_date), 'd MMM', { locale: nl })
              }
            </span>
          </div>
        )}
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30" />
      </div>
    </button>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16">
      <CalendarIcon className="h-8 w-8 text-muted-foreground/20 mx-auto mb-3" />
      <p className="text-[13px] text-muted-foreground">Geen geplande projecten</p>
    </div>
  );
}
