import { CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReadinessItem {
  label: string;
  met: boolean;
  optional?: boolean;
}

interface ReadinessChecklistProps {
  items: ReadinessItem[];
}

export function ReadinessChecklist({ items }: ReadinessChecklistProps) {
  const requiredItems = items.filter(i => !i.optional);
  const metCount = requiredItems.filter(i => i.met).length;
  const allMet = metCount === requiredItems.length;

  return (
    <div className="rounded-2xl bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] uppercase tracking-[0.08em] font-semibold text-muted-foreground/40">Gereedheid</h3>
        <span className={cn(
          'text-[11px] font-semibold tabular-nums',
          allMet ? 'text-[hsl(var(--status-completed))]' : 'text-muted-foreground/50'
        )}>
          {allMet ? 'Gereed' : `${metCount}/${requiredItems.length}`}
        </span>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2.5">
            {item.met ? (
              <CheckCircle2 className="h-4 w-4 text-[hsl(var(--status-completed))] shrink-0" />
            ) : (
              <Circle className={cn(
                'h-4 w-4 shrink-0',
                item.optional ? 'text-muted-foreground/20' : 'text-muted-foreground/30'
              )} />
            )}
            <span className={cn(
              'text-[13px]',
              item.met ? 'text-foreground' : 'text-muted-foreground/50'
            )}>
              {item.label}
              {item.optional && <span className="text-muted-foreground/30 ml-1 text-[11px]">(optioneel)</span>}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
