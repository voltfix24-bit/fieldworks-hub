import { WizardStepHeader } from '../WizardStepHeader';
import { DepthMeasurementTable } from '../../DepthMeasurementTable';
import { Input } from '@/components/ui/input';
import { Gauge } from 'lucide-react';
import { GroundingIcon } from '../../GroundingIcon';

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

  return (
    <div className="space-y-4">
      <WizardStepHeader
        title={`Dieptemetingen — ${penCode}`}
        subtitle="Voer de weerstandswaarden in per diepte"
      />

      {/* RA / RV summary block */}
      <div className="rounded-xl border border-border bg-card p-3 space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
            <GroundingIcon size={16} className="text-accent" />
          </div>
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">RA-waarde</span>
              <span className="text-sm font-bold text-accent">
                {electrode.ra_value != null ? `${Number(electrode.ra_value).toFixed(2)} Ω` : '—'}
              </span>
            </div>
            {electrode.ra_value != null && (
              <span className="text-[10px] text-muted-foreground">Laagst gemeten weerstand</span>
            )}
          </div>
        </div>

        {showRv && (
          <div className="flex items-center gap-3 pt-2 border-t border-border">
            <div className="w-8" />
            <div className="flex-1 space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">RV-waarde</span>
              <Input
                type="number"
                inputMode="decimal"
                step="0.01"
                value={electrode.rv_value ?? ''}
                onChange={e => onUpdateElectrode({ rv_value: e.target.value ? parseFloat(e.target.value) : null })}
                placeholder="Ω"
                className="h-10 text-sm font-semibold"
              />
              <span className="text-[10px] text-muted-foreground">In te vullen bij gekoppelde pennen</span>
            </div>
          </div>
        )}
      </div>

      {/* Depth measurement list */}
      <DepthMeasurementTable
        measurements={measurements}
        onAdd={onAdd}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />
    </div>
  );
}
