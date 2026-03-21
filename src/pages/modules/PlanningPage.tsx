import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { useProjects } from '@/hooks/use-projects';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Calendar as CalendarIcon, MapPin, FolderOpen, ChevronRight,
  List, ChevronLeft, LayoutGrid,
} from 'lucide-react';
import {
  format, parseISO, isToday, isThisWeek,
  startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay,
  addMonths, subMonths, isSameMonth, isPast, isTomorrow,
} from 'date-fns';
import { nl } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type ViewMode = 'list' | 'calendar';

export default function PlanningPage() {
  const navigate = useNavigate();
  const { data: projects = [] } = useProjects();
  const isMobile = useIsMobile();
  const [view, setView] = useState<ViewMode>('list');
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

  const renderGroup = (title: string, items: typeof planned) => {
    if (items.length === 0) return null;
    return (
      <section className="space-y-2">
        <p className="text-[11px] uppercase tracking-[0.08em] font-semibold text-muted-foreground/50 px-0.5">{title}</p>
        <div className="space-y-1.5">
          {items.map(p => <ProjectRow key={p.id} project={p} onClick={() => navigate(`/projects/${p.id}`)} />)}
        </div>
      </section>
    );
  };

  return (
    <div className="animate-fade-in">
      <PageHeader title="Planning" description={isMobile ? undefined : 'Geplande projecten en meetafspraken'} action={
        <div className="flex items-center gap-0.5 bg-muted/40 rounded-xl p-0.5">
          <button onClick={() => setView('list')} className={cn(
            'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-all',
            view === 'list' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground/60'
          )}>
            <List className="h-3.5 w-3.5" /> Lijst
          </button>
          <button onClick={() => setView('calendar')} className={cn(
            'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-all',
            view === 'calendar' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground/60'
          )}>
            <LayoutGrid className="h-3.5 w-3.5" /> Kalender
          </button>
        </div>
      } />

      {view === 'list' && (
        <div className={cn(isMobile ? 'space-y-5' : 'space-y-6')}>
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
        <div className="space-y-4">
          <div className="bg-card rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setCalMonth(m => subMonths(m, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <button onClick={() => { setCalMonth(new Date()); setSelectedDate(new Date()); }}
                className="text-[15px] font-semibold text-foreground capitalize">
                {format(calMonth, 'MMMM yyyy', { locale: nl })}
              </button>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setCalMonth(m => addMonths(m, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-7 px-2">
              {['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'].map(d => (
                <div key={d} className="text-center text-[10px] uppercase tracking-wider font-medium text-muted-foreground/30 py-2">{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 px-2 pb-3">
              {Array.from({ length: firstDayOffset }).map((_, i) => <div key={`e-${i}`} className="aspect-square" />)}
              {calDays.map(day => {
                const dateKey = format(day, 'yyyy-MM-dd');
                const dayProjects = projectsByDate.get(dateKey) || [];
                const today = isToday(day);
                const selected = isSameDay(day, selectedDate);
                const hasProjects = dayProjects.length > 0;
                const past = isPast(day) && !today;

                return (
                  <button key={dateKey} onClick={() => setSelectedDate(day)}
                    className={cn(
                      'aspect-square flex flex-col items-center justify-center relative rounded-xl transition-all mx-0.5 my-0.5',
                      selected && today && 'bg-[hsl(var(--tenant-primary))]',
                      selected && !today && 'bg-muted/50',
                      !selected && 'active:scale-95',
                    )}>
                    <span className={cn(
                      'text-[13px] font-medium leading-none',
                      selected && today && 'text-white font-semibold',
                      !selected && today && 'text-[hsl(var(--tenant-primary))] font-semibold',
                      !today && !selected && past && 'text-muted-foreground/30',
                      !today && !selected && !past && 'text-foreground/80',
                      selected && !today && 'text-foreground font-semibold',
                    )}>{format(day, 'd')}</span>
                    {hasProjects && (
                      <div className="flex items-center gap-[3px] mt-1">
                        {dayProjects.slice(0, 3).map((_, i) => (
                          <div key={i} className={cn(
                            'w-[4px] h-[4px] rounded-full',
                            selected && today ? 'bg-white/60' : 'bg-[hsl(var(--tenant-primary)/0.4)]',
                          )} />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between px-0.5">
              <h3 className="text-[13px] font-semibold text-foreground capitalize">{getSelectedDateLabel()}</h3>
              {selectedProjects.length > 0 && (
                <span className="text-[11px] text-muted-foreground/40">{selectedProjects.length} {selectedProjects.length === 1 ? 'project' : 'projecten'}</span>
              )}
            </div>
            {selectedProjects.length === 0 ? (
              <div className="py-8 flex flex-col items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-muted-foreground/15" />
                <p className="text-[12px] text-muted-foreground/40">Geen projecten op deze dag</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {selectedProjects.map(p => <ProjectRow key={p.id} project={p} onClick={() => navigate(`/projects/${p.id}`)} />)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ProjectRow({ project: p, onClick }: { project: any; onClick: () => void }) {
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
