import { WizardStepHeader } from '../WizardStepHeader';
import { DepthMeasurementTable } from '../../DepthMeasurementTable';
import { Input } from '@/components/ui/input';
import { GroundingIcon } from '../../GroundingIcon';
import { cn } from '@/lib/utils';

interface MeasurementStepProps {
  measurements: any[];
  onAdd: (depth: number, resistance: number) => void;
  onUpdate: (id: string, depth: number, resistance: number) => void;
  onDelete: (id: string) => void;
  electrode: any;
  penCount: number;
  onUpdateElectrode: (updates: any) => void;
  penCode: string;
}

export function MeasurementStep({
  measurements, onAdd, onUpdate, onDelete,
  electrode, penCount, onUpdateElectrode, penCode,
}: MeasurementStepProps) {
  const showRv = penCount > 1;
  const hasTarget = electrode.target_value != null;
  const targetMet = hasTarget && electrode.ra_value != null && electrode.ra_value <= electrode.target_value;

  return (
    <div className="space-y-5">
      <WizardStepHeader
        title={`Dieptemetingen — ${penCode}`}
        subtitle="Voer de weerstandswaarden in per diepte"
      />

      {/* ─── RA / RV insight block ─── */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
        {/* RA row */}
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-9 h-9 rounded-lg bg-primary/6 flex items-center justify-center shrink-0">
            <GroundingIcon size={16} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold block">RA-waarde</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className={cn(
                'text-lg font-bold tabular-nums leading-none',
                electrode.ra_value != null ? 'text-primary' : 'text-muted-foreground/30'
              )}>
                {electrode.ra_value != null ? `${Number(electrode.ra_value).toFixed(2)} Ω` : '—'}
              </span>
              {electrode.ra_value != null && (
                <span className="text-[11px] text-muted-foreground">laagst gemeten</span>
              )}
            </div>
          </div>
          {/* Target indicator */}
          {hasTarget && (
            <div className={cn(
              'text-right shrink-0 px-3 py-1.5 rounded-lg',
              targetMet ? 'bg-[hsl(var(--status-completed)/0.08)]' : 'bg-muted/30'
            )}>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium block">Doel</span>
              <span className={cn(
                'text-[13px] font-semibold tabular-nums',
                targetMet ? 'text-[hsl(var(--status-completed))]' : 'text-muted-foreground'
              )}>
                {Number(electrode.target_value).toFixed(2)} Ω
              </span>
            </div>
          )}
        </div>

        {/* RV row — only when multiple pens */}
        {showRv && (
          <div className="flex items-center gap-3 px-4 py-3 border-t border-border/40 bg-muted/10">
            <div className="w-9" />
            <div className="flex-1 space-y-1.5">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold block">RV-waarde</span>
              <Input
                type="number"
                inputMode="decimal"
                step="0.01"
                value={electrode.rv_value ?? ''}
                onChange={e => onUpdateElectrode({ rv_value: e.target.value ? parseFloat(e.target.value) : null })}
                placeholder="Ω"
                className="h-10 text-[13px] font-semibold max-w-[180px]"
              />
              <span className="text-[10px] text-muted-foreground/50">In te vullen bij gekoppelde pennen</span>
            </div>
          </div>
        )}
      </div>

      {/* ─── Depth measurement list ─── */}
      <DepthMeasurementTable
        measurements={measurements}
        onAdd={onAdd}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />
    </div>
  );
}
