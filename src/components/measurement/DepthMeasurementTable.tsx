import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Plus, GripVertical } from 'lucide-react';

interface DepthRow {
  id?: string;
  depth_meters: number;
  resistance_value: number;
  sort_order: number;
}

interface DepthMeasurementTableProps {
  measurements: DepthRow[];
  onAdd: (depth: number, resistance: number) => void;
  onUpdate: (id: string, depth: number, resistance: number) => void;
  onDelete: (id: string) => void;
  disabled?: boolean;
}

export function DepthMeasurementTable({ measurements, onAdd, onUpdate, onDelete, disabled }: DepthMeasurementTableProps) {
  const [newDepth, setNewDepth] = useState('');
  const [newResistance, setNewResistance] = useState('');

  const handleAdd = () => {
    const d = parseFloat(newDepth);
    const r = parseFloat(newResistance);
    if (isNaN(d) || isNaN(r)) return;
    onAdd(d, r);
    setNewDepth('');
    setNewResistance('');
  };

  const lowestResistance = measurements.length > 0
    ? Math.min(...measurements.map(m => m.resistance_value))
    : null;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="grid grid-cols-[1fr_1fr_40px] gap-2 text-xs font-medium text-muted-foreground px-1">
        <span>Depth (m)</span>
        <span>Resistance (Ω)</span>
        <span></span>
      </div>

      {/* Existing rows */}
      {measurements.map((m) => (
        <DepthRow key={m.id} row={m} onUpdate={onUpdate} onDelete={onDelete} isLowest={m.resistance_value === lowestResistance} disabled={disabled} />
      ))}

      {/* Add row */}
      <div className="grid grid-cols-[1fr_1fr_40px] gap-2 items-end">
        <Input
          type="number"
          inputMode="decimal"
          step="0.1"
          placeholder="0.0"
          value={newDepth}
          onChange={e => setNewDepth(e.target.value)}
          className="h-9 text-sm"
          disabled={disabled}
        />
        <Input
          type="number"
          inputMode="decimal"
          step="0.01"
          placeholder="0.00"
          value={newResistance}
          onChange={e => setNewResistance(e.target.value)}
          className="h-9 text-sm"
          disabled={disabled}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
        />
        <Button size="sm" variant="outline" onClick={handleAdd} disabled={disabled || !newDepth || !newResistance} className="h-9 w-9 p-0">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Lowest value indicator */}
      {lowestResistance !== null && (
        <div className="flex items-center gap-2 px-2 py-1.5 bg-accent/10 rounded-md border border-accent/20">
          <span className="text-xs font-medium text-accent">RA basis: {lowestResistance.toFixed(2)} Ω</span>
          <span className="text-xs text-muted-foreground">(lowest recorded)</span>
        </div>
      )}
    </div>
  );
}

function DepthRow({ row, onUpdate, onDelete, isLowest, disabled }: {
  row: DepthRow;
  onUpdate: (id: string, depth: number, resistance: number) => void;
  onDelete: (id: string) => void;
  isLowest: boolean;
  disabled?: boolean;
}) {
  const [depth, setDepth] = useState(String(row.depth_meters));
  const [resistance, setResistance] = useState(String(row.resistance_value));

  useEffect(() => {
    setDepth(String(row.depth_meters));
    setResistance(String(row.resistance_value));
  }, [row.depth_meters, row.resistance_value]);

  const handleBlur = () => {
    const d = parseFloat(depth);
    const r = parseFloat(resistance);
    if (!isNaN(d) && !isNaN(r) && row.id && (d !== row.depth_meters || r !== row.resistance_value)) {
      onUpdate(row.id, d, r);
    }
  };

  return (
    <div className={`grid grid-cols-[1fr_1fr_40px] gap-2 items-center ${isLowest ? 'bg-accent/5 rounded-md px-1 -mx-1' : ''}`}>
      <Input
        type="number"
        inputMode="decimal"
        step="0.1"
        value={depth}
        onChange={e => setDepth(e.target.value)}
        onBlur={handleBlur}
        className={`h-9 text-sm ${isLowest ? 'font-semibold text-accent' : ''}`}
        disabled={disabled}
      />
      <Input
        type="number"
        inputMode="decimal"
        step="0.01"
        value={resistance}
        onChange={e => setResistance(e.target.value)}
        onBlur={handleBlur}
        className={`h-9 text-sm ${isLowest ? 'font-semibold text-accent' : ''}`}
        disabled={disabled}
      />
      <Button size="sm" variant="ghost" onClick={() => row.id && onDelete(row.id)} disabled={disabled} className="h-9 w-9 p-0 text-muted-foreground hover:text-destructive">
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
