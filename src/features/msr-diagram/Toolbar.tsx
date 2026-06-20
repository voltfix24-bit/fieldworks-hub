import { Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DoorSideSelector } from './DoorSideSelector';
import type { MSRDiagram, DoorSide } from './types';

interface Props {
  diagram: MSRDiagram;
  selectedElectrodeId: string | null;
  onHousingNumberChange: (v: string) => void;
  onDoorSideChange: (v: DoorSide) => void;
  onAddElectrode: () => void;
  onRenameElectrode: (id: string, label: string) => void;
  onRemoveElectrode: (id: string) => void;
}

export function DiagramToolbar({
  diagram,
  selectedElectrodeId,
  onHousingNumberChange,
  onDoorSideChange,
  onAddElectrode,
  onRenameElectrode,
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
        <div className="rounded-lg border border-border/60 p-2.5 bg-muted/20">
          <div className="flex items-center gap-2">
            <Input
              value={sel.label}
              onChange={(e) => onRenameElectrode(sel.id, e.target.value)}
              className="h-9 text-[13px]"
              placeholder="Label"
            />
            <button
              onClick={() => onRemoveElectrode(sel.id)}
              className="h-9 w-9 flex items-center justify-center rounded-lg text-destructive hover:bg-destructive/10"
              aria-label="Verwijder elektrode"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <p className="text-[10.5px] text-muted-foreground mt-1.5">
            Pos: {sel.x.toFixed(0)} · {sel.y.toFixed(0)} (sleep op canvas om te verplaatsen)
          </p>
        </div>
      )}
    </div>
  );
}
