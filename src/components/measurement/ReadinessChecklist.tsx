import { CheckCircle2, Circle, AlertCircle } from 'lucide-react';

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
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Gereedheid</h3>
        <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${allMet ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
          {allMet ? 'Gereed' : `${metCount}/${requiredItems.length}`}
        </span>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2.5">
            {item.met ? (
              <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
            ) : item.optional ? (
              <Circle className="h-4 w-4 text-muted-foreground/30 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-orange-500 shrink-0" />
            )}
            <span className={`text-sm ${item.met ? 'text-foreground' : item.optional ? 'text-muted-foreground' : 'text-foreground'}`}>
              {item.label}
              {item.optional && <span className="text-muted-foreground ml-1 text-xs">(optioneel)</span>}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
