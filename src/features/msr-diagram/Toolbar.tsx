import { Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { DoorSideSelector } from './DoorSideSelector';
import type { DiagramElectrode, DoorSide, MSRAnchor, MSRDiagram } from './types';

interface Props {
  diagram: MSRDiagram;
  selectedElectrodeId: string | null;
  onHousingNumberChange: (v: string) => void;
  onDoorSideChange: (v: DoorSide) => void;
  onAddElectrode: () => void;
  onRenameElectrode: (id: string, label: string) => void;
  onUpdateElectrode: (id: string, patch: Partial<DiagramElectrode>) => void;
  onRemoveElectrode: (id: string) => void;
}

const anchors: Array<{ value: MSRAnchor; label: string }> = [
  { value: 'tl', label: 'LB' },
  { value: 'tr', label: 'RB' },
  { value: 'bl', label: 'LO' },
  { value: 'br', label: 'RO' },
];

export function DiagramToolbar({
  diagram,
  selectedElectrodeId,
  onHousingNumberChange,
  onDoorSideChange,
  onAddElectrode,
  onRenameElectrode,
  onUpdateElectrode,
  onRemoveElectrode,
}: Props) {
  const sel = diagram.electrodes.find((e) => e.id === selectedElectrodeId) || null;

  return (
    <div className="p-3 space-y-3 bg-card border-t border-border/60">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-[11px] text-muted-foreground font-medium">Behuizingsnummer</Label>
          <Input
            value={diagram.cabinet.housingNumber}
            onChange={(e) => onHousingNumberChange(e.target.value)}
            placeholder="MSR-01"
            className="h-9 text-[13px] mt-1"
          />
        </div>
        <div>
          <Label className="text-[11px] text-muted-foreground font-medium">Elektrodes</Label>
          <div className="h-9 mt-1 flex items-center">
            <button
              onClick={onAddElectrode}
              className="h-9 px-3 rounded-lg bg-[hsl(var(--tenant-primary,var(--primary)))] text-white text-[12px] font-semibold flex items-center gap-1.5 active:scale-[0.97]"
            >
              <Plus className="h-3.5 w-3.5" />
              Toevoegen
            </button>
          </div>
        </div>
      </div>

      <div>
        <Label className="text-[11px] text-muted-foreground font-medium">Deurzijde</Label>
        <div className="mt-1">
          <DoorSideSelector value={diagram.cabinet.doorSide} onChange={onDoorSideChange} />
        </div>
      </div>

      {sel && (
        <div className="rounded-lg border border-border/60 p-2.5 bg-muted/20 space-y-3">
          <div className="flex items-center gap-2">
            <Input
              value={sel.label}
              onChange={(e) => onRenameElectrode(sel.id, e.target.value)}
              className="h-9 text-[13px]"
              placeholder="Label"
            />
            <button
              onClick={() => onRemoveElectrode(sel.id)}
              className="h-9 w-9 flex items-center justify-center rounded-lg text-destructive hover:bg-destructive/10 shrink-0"
              aria-label="Verwijder elektrode"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          <div>
            <Label className="text-[11px] text-muted-foreground font-medium">Referentiehoek MSR</Label>
            <div className="grid grid-cols-4 gap-1.5 mt-1">
              {anchors.map((anchor) => {
                const active = (sel.anchor ?? 'br') === anchor.value;
                return (
                  <button
                    key={anchor.value}
                    type="button"
                    onClick={() => onUpdateElectrode(sel.id, { anchor: anchor.value })}
                    className={cn(
                      'h-8 rounded-lg text-[11px] font-semibold border active:scale-[0.97]',
                      active
                        ? 'bg-[hsl(var(--tenant-primary,var(--primary)))] text-white border-transparent'
                        : 'bg-background text-muted-foreground border-border/60'
                    )}
                  >
                    {anchor.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <DistanceInput
              label="Horizontaal (m)"
              value={sel.overrideDistanceX}
              onChange={(value) => onUpdateElectrode(sel.id, { overrideDistanceX: value })}
            />
            <DistanceInput
              label="Verticaal (m)"
              value={sel.overrideDistanceY}
              onChange={(value) => onUpdateElectrode(sel.id, { overrideDistanceY: value })}
            />
          </div>

          <p className="text-[10.5px] text-muted-foreground mt-1.5">
            Laat H/V leeg om automatisch uit de tekening te berekenen. Vul een waarde in als de schets niet precies op schaal is.
          </p>
        </div>
      )}
    </div>
  );
}

function DistanceInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: number | null;
  onChange: (value: number | null) => void;
}) {
  return (
    <div>
      <Label className="text-[11px] text-muted-foreground font-medium">{label}</Label>
      <Input
        type="number"
        inputMode="decimal"
        min="0"
        step="0.01"
        value={value ?? ''}
        onChange={(e) => {
          if (e.target.value === '') {
            onChange(null);
            return;
          }
          const next = Number(e.target.value);
          onChange(Number.isFinite(next) ? next : null);
        }}
        placeholder="Auto"
        className="h-9 text-[13px] mt-1"
      />
    </div>
  );
}
