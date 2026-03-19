import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { useProjects } from '@/hooks/use-projects';
import { Calendar, MapPin, FolderOpen } from 'lucide-react';
import { format, isToday, isThisWeek, parseISO } from 'date-fns';
import { nl } from 'date-fns/locale';

export default function PlanningPage() {
  const navigate = useNavigate();
  const { data: projects = [] } = useProjects();

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

  const renderGroup = (title: string, items: typeof planned) => {
    if (items.length === 0) return null;
    return (
      <div className="space-y-2">
        <h3 className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground/60 px-1">{title}</h3>
        <div className="space-y-1.5">
          {items.map(p => (
            <button
              key={p.id}
              onClick={() => navigate(`/projects/${p.id}`)}
              className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl border border-border/40 bg-card hover:bg-muted/15 transition-all text-left active:scale-[0.998]"
            >
              <div className="w-9 h-9 rounded-lg bg-primary/6 flex items-center justify-center shrink-0">
                <FolderOpen className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-foreground truncate">{p.project_name}</p>
                <div className="flex items-center gap-2.5 mt-0.5">
                  <span className="text-[11px] text-muted-foreground font-mono">{p.project_number}</span>
                  {p.city && (
                    <span className="text-[11px] text-muted-foreground flex items-center gap-0.5">
                      <MapPin className="h-2.5 w-2.5" />{p.city}
                    </span>
                  )}
                </div>
              </div>
              {p.planned_date && (
                <span className="text-[11px] text-muted-foreground/70 tabular-nums shrink-0">
                  {format(parseISO(p.planned_date), 'd MMM', { locale: nl })}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="animate-fade-in">
      <PageHeader title="Planning" description="Geplande projecten en meetafspraken" />
      <div className="space-y-6">
        {renderGroup('Vandaag', todayProjects)}
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
