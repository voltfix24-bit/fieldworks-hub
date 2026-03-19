import { CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
    <Card>
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">Report Readiness</CardTitle>
          <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${allMet ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
            {allMet ? 'Ready' : `${metCount}/${requiredItems.length}`}
          </span>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-3 pt-0">
        <div className="space-y-1.5">
          {items.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              {item.met ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />
              ) : item.optional ? (
                <Circle className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
              ) : (
                <AlertCircle className="h-3.5 w-3.5 text-orange-500 shrink-0" />
              )}
              <span className={`text-xs ${item.met ? 'text-foreground' : item.optional ? 'text-muted-foreground' : 'text-foreground'}`}>
                {item.label}
                {item.optional && <span className="text-muted-foreground ml-1">(optional)</span>}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
