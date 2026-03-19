import { WizardStepHeader } from '../WizardStepHeader';
import { CheckCircle2, Circle, AlertCircle } from 'lucide-react';

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
    <div className="space-y-4">
      <WizardStepHeader
        title="Controle & Gereedheid"
        subtitle="Controleer of alle onderdelen zijn ingevuld"
      />

      <div className="rounded-xl border border-border bg-card p-4 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">Rapportgereedheid</span>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
            allMet ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
          }`}>
            {allMet ? 'Gereed' : `${metCount}/${requiredItems.length}`}
          </span>
        </div>

        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              {item.met ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
              ) : item.optional ? (
                <Circle className="h-5 w-5 text-muted-foreground/30 shrink-0" />
              ) : (
                <AlertCircle className="h-5 w-5 text-orange-500 shrink-0" />
              )}
              <span className={`text-sm ${item.met ? 'text-foreground' : item.optional ? 'text-muted-foreground' : 'text-foreground'}`}>
                {item.label}
                {item.optional && <span className="text-muted-foreground ml-1 text-xs">(optioneel)</span>}
              </span>
            </div>
          ))}
        </div>

        {allMet && (
          <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-center">
            <p className="text-sm font-medium text-green-800">Project is rapportgereed ✓</p>
            <p className="text-xs text-green-600 mt-0.5">Alle verplichte onderdelen zijn ingevuld</p>
          </div>
        )}
      </div>
    </div>
  );
}
