import { WizardStepHeader } from '../WizardStepHeader';
import { CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReadinessItem {
  label: string;
  met: boolean;
  optional?: boolean;
}

interface ReadinessStepProps {
  items: ReadinessItem[];
}

export function ReadinessStep({ items }: ReadinessStepProps) {
  const requiredItems = items.filter(i => !i.optional);
  const metCount = requiredItems.filter(i => i.met).length;
  const allMet = metCount === requiredItems.length;

  return (
    <div>
      <WizardStepHeader
        title="Controle & Gereedheid"
        subtitle="Controleer of alle onderdelen zijn ingevuld"
      />

      <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
        {/* Status header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-border/40 bg-muted/10">
          <span className="text-[13px] font-semibold text-foreground">Rapportgereedheid</span>
          <span className={cn(
            'text-[11px] px-2.5 py-1 rounded-full font-semibold',
            allMet
              ? 'bg-[hsl(var(--status-completed)/0.1)] text-[hsl(var(--status-completed))]'
              : 'bg-destructive/10 text-destructive'
          )}>
            {allMet ? 'Gereed' : `${metCount}/${requiredItems.length}`}
          </span>
        </div>

        {/* Checklist */}
        <div className="divide-y divide-border/30">
          {items.map((item) => (
            <div key={item.label} className="flex items-center gap-3 px-4 py-3">
              {item.met ? (
                <CheckCircle2 className="h-[18px] w-[18px] text-[hsl(var(--status-completed))] shrink-0" />
              ) : item.optional ? (
                <Circle className="h-[18px] w-[18px] text-muted-foreground/20 shrink-0" />
              ) : (
                <AlertCircle className="h-[18px] w-[18px] text-destructive shrink-0" />
              )}
              <span className={cn(
                'text-[13px]',
                item.met ? 'text-foreground font-medium' : item.optional ? 'text-muted-foreground' : 'text-foreground'
              )}>
                {item.label}
                {item.optional && <span className="text-muted-foreground/50 ml-1.5 text-[11px]">(optioneel)</span>}
              </span>
            </div>
          ))}
        </div>

        {/* Success footer */}
        {allMet && (
          <div className="px-4 py-3.5 bg-[hsl(var(--status-completed)/0.04)] border-t border-[hsl(var(--status-completed)/0.1)]">
            <p className="text-[13px] font-semibold text-[hsl(var(--status-completed))] text-center">
              Project is rapportgereed ✓
            </p>
            <p className="text-[11px] text-muted-foreground text-center mt-0.5">
              Alle verplichte onderdelen zijn ingevuld
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
