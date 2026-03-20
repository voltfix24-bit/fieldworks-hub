import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { useProjects } from '@/hooks/use-projects';
import { useIsMobile } from '@/hooks/use-mobile';
import { Calendar, MapPin, FolderOpen, ChevronRight } from 'lucide-react';
import { format, isToday, isThisWeek, parseISO } from 'date-fns';
import { nl } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function PlanningPage() {
  const navigate = useNavigate();
  const { data: projects = [] } = useProjects();
  const isMobile = useIsMobile();

  const planned = projects
    .filter(p => p.status === 'planned' && p.planned_date)
    .sort((a, b) => (a.planned_date || '').localeCompare(b.planned_date || ''));

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

  const renderGroup = (title: string, items: typeof planned, highlight?: boolean) => {
    if (items.length === 0) return null;
    return (
      <div className="space-y-1.5">
        <h3 className={cn(
          'text-[11px] uppercase tracking-widest font-semibold px-0.5',
          highlight ? 'text-[hsl(var(--tenant-primary,var(--primary))/0.7)]' : 'text-muted-foreground/60'
        )}>{title}</h3>
        <div className="space-y-1.5">
          {items.map(p => (
            <button
              key={p.id}
              onClick={() => navigate(`/projects/${p.id}`)}
              className={cn(
                'w-full flex items-center gap-3 rounded-xl border bg-card hover:bg-muted/15 transition-all text-left active:scale-[0.998]',
                isMobile ? 'px-3 py-2.5 border-border/30' : 'px-3.5 py-3 border-border/40'
              )}
            >
              <div className={cn(
                'rounded-lg flex items-center justify-center shrink-0',
                isMobile ? 'w-8 h-8' : 'w-9 h-9',
                'bg-[hsl(var(--tenant-primary,var(--primary))/0.06)]'
              )}>
                <FolderOpen className={cn(
                  'text-[hsl(var(--tenant-primary,var(--primary))/0.5)]',
                  isMobile ? 'h-3.5 w-3.5' : 'h-4 w-4'
                )} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn(
                  'font-semibold text-foreground truncate',
                  isMobile ? 'text-[13px]' : 'text-[13px]'
                )}>{p.project_name}</p>
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
                  <span className="text-[11px] text-muted-foreground/60 tabular-nums font-medium">
                    {format(parseISO(p.planned_date), 'd MMM', { locale: nl })}
                  </span>
                )}
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30" />
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="animate-fade-in">
      <PageHeader title="Planning" description="Geplande projecten en meetafspraken" />
      <div className={cn(isMobile ? 'space-y-4' : 'space-y-6')}>
        {renderGroup('Vandaag', todayProjects, true)}
        {renderGroup('Deze week', weekProjects)}
        {renderGroup('Later', laterProjects)}
        {planned.length === 0 && (
          <div className="text-center py-16">
            <Calendar className="h-8 w-8 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-[13px] text-muted-foreground">Geen geplande projecten</p>
          </div>
        )}
      </div>
    </div>
  );
}
