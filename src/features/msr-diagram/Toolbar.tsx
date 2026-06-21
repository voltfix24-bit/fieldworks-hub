import { X, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { DoorSideSelector } from './DoorSideSelector';
import type { DiagramElectrode, DoorSide, MSRAnchor, MSRDiagram } from './types';

export type Selection =
  | { kind: 'electrode'; id: string }
  | { kind: 'cabinet' }
  | null;

interface Props {
  diagram: MSRDiagram;
  selection: Selection;
  onClose: () => void;
  onHousingNumberChange: (v: string) => void;
  onDoorSideChange: (v: DoorSide) => void;
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
  selection,
  onClose,
  onHousingNumberChange,
  onDoorSideChange,
  onRenameElectrode,
  onUpdateElectrode,
  onRemoveElectrode,
}: Props) {
  if (!selection) return null;

  return (
    <div className="absolute inset-x-0 bottom-0 z-20 px-3 pb-[max(12px,env(safe-area-inset-bottom))]">
      <div className="relative rounded-2xl border border-border/60 bg-white/95 backdrop-blur p-3 shadow-xl space-y-3">
        <button
          type="button"
          onClick={onClose}
          aria-label="Sluiten"
          className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted/40 active:scale-95"
        >
          <X className="h-4 w-4" />
        </button>

        {selection.kind === 'cabinet' ? (
          <CabinetPanel
            diagram={diagram}
            onHousingNumberChange={onHousingNumberChange}
            onDoorSideChange={onDoorSideChange}
          />
        ) : (
          <ElectrodePanel
            diagram={diagram}
            electrodeId={selection.id}
            onRenameElectrode={onRenameElectrode}
            onUpdateElectrode={onUpdateElectrode}
            onRemoveElectrode={onRemoveElectrode}
          />
        )}
      </div>
    </div>
  );
}

function CabinetPanel({
  diagram,
  onHousingNumberChange,
  onDoorSideChange,
}: {
  diagram: MSRDiagram;
  onHousingNumberChange: (v: string) => void;
  onDoorSideChange: (v: DoorSide) => void;
}) {
  return (
    <div className="space-y-3 pr-8">
      <p className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">MSR / kast</p>
      <div>
        <Label className="text-[10px] text-muted-foreground font-medium">Naam / nummer</Label>
        <Input
          value={diagram.cabinet.housingNumber}
          onChange={(e) => onHousingNumberChange(e.target.value)}
          placeholder="MSR"
          className="h-10 text-[14px] mt-1"
        />
      </div>
      <div>
        <Label className="text-[10px] text-muted-foreground font-medium">Deurzijde</Label>
        <div className="mt-1">
          <DoorSideSelector value={diagram.cabinet.doorSide} onChange={onDoorSideChange} />
        </div>
      </div>
    </div>
  );
}

function ElectrodePanel({
  diagram,
  electrodeId,
  onRenameElectrode,
  onUpdateElectrode,
  onRemoveElectrode,
}: {
  diagram: MSRDiagram;
  electrodeId: string;
  onRenameElectrode: (id: string, label: string) => void;
  onUpdateElectrode: (id: string, patch: Partial<DiagramElectrode>) => void;
  onRemoveElectrode: (id: string) => void;
}) {
  const sel = diagram.electrodes.find((e) => e.id === electrodeId);
  if (!sel) return null;

  return (
    <div className="space-y-3 pr-8">
      <div className="flex items-center gap-2">
        <Input
          value={sel.label}
          onChange={(e) => onRenameElectrode(sel.id, e.target.value)}
          className="h-9 text-[13px]"
          placeholder="Elektrode label"
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
        <Label className="text-[10px] text-muted-foreground font-medium">Referentiehoek</Label>
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
                    ? 'bg-emerald-600 text-white border-transparent'
                    : 'bg-muted/20 text-muted-foreground border-border/60'
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
          label="H (m)"
          value={sel.overrideDistanceX}
          onChange={(value) => onUpdateElectrode(sel.id, { overrideDistanceX: value })}
        />
        <DistanceInput
          label="V (m)"
          value={sel.overrideDistanceY}
          onChange={(value) => onUpdateElectrode(sel.id, { overrideDistanceY: value })}
        />
      </div>
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
      <Label className="text-[10px] text-muted-foreground font-medium">{label}</Label>
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
