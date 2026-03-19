import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, ArrowDown, Gauge } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DepthRow {
  id?: string;
  depth_meters: number;
  resistance_value: number;
  sort_order: number;
}

const PREDEFINED_DEPTHS = [3, 6, 9, 12, 15, 18, 21, 24, 27, 30];

interface DepthMeasurementTableProps {
  measurements: DepthRow[];
  onAdd: (depth: number, resistance: number) => void;
  onUpdate: (id: string, depth: number, resistance: number) => void;
  onDelete: (id: string) => void;
  disabled?: boolean;
  /** Called to initialize predefined rows when pen has no measurements */
  onInitPredefined?: (depths: number[]) => void;
}

export function DepthMeasurementTable({ measurements, onAdd, onUpdate, onDelete, disabled, onInitPredefined }: DepthMeasurementTableProps) {
  const [initialized, setInitialized] = useState(false);

  // Auto-initialize predefined depth rows for new pens
  useEffect(() => {
    if (!initialized && measurements.length === 0 && onInitPredefined) {
      onInitPredefined(PREDEFINED_DEPTHS);
      setInitialized(true);
    } else if (measurements.length > 0) {
      setInitialized(true);
    }
  }, [measurements.length, initialized, onInitPredefined]);

  const lowestResistance = measurements.length > 0
    ? Math.min(...measurements.filter(m => m.resistance_value > 0).map(m => m.resistance_value))
    : null;
  const lowestIsValid = lowestResistance !== null && lowestResistance !== Infinity;

  // Calculate next deeper depth
  const maxDepth = measurements.length > 0
    ? Math.max(...measurements.map(m => m.depth_meters))
    : 27;
  const nextDepth = maxDepth > 0 ? maxDepth + 3 : 33;

  const handleAddDeeper = () => {
    onAdd(nextDepth, 0);
  };

  return (
    <div className="space-y-0">
      {/* Header */}
      <div className="grid grid-cols-[60px_1fr_44px] sm:grid-cols-[80px_1fr_44px] gap-1 px-1 pb-2">
        <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Diepte</span>
        <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Weerstand (Ω)</span>
        <span></span>
      </div>

      {/* Measurement rows */}
      <div className="space-y-0.5">
        {measurements.map((m) => (
          <DepthRowComponent
            key={m.id}
            row={m}
            onUpdate={onUpdate}
            onDelete={onDelete}
            isLowest={lowestIsValid && m.resistance_value === lowestResistance && m.resistance_value > 0}
            disabled={disabled}
          />
        ))}
      </div>

      {/* Add deeper action */}
      <button
        onClick={handleAddDeeper}
        disabled={disabled}
        className={cn(
          'w-full flex items-center justify-center gap-2 py-3 mt-2',
          'rounded-lg border border-dashed border-border',
          'text-xs font-medium text-muted-foreground',
          'hover:border-accent/40 hover:text-accent hover:bg-accent/5',
          'transition-all active:scale-[0.99]',
          'disabled:opacity-40 disabled:cursor-not-allowed'
        )}
      >
        <ArrowDown className="h-3.5 w-3.5" />
        Dieper slaan — {nextDepth}m
      </button>

      {/* RA summary */}
      {lowestIsValid && (
        <div className="flex items-center gap-2.5 mt-3 px-3 py-2.5 rounded-lg bg-accent/8 border border-accent/15">
          <Gauge className="h-4 w-4 text-accent shrink-0" />
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-semibold text-accent">{lowestResistance!.toFixed(2)} Ω</span>
              <span className="text-xs text-muted-foreground">RA basis — laagst gemeten</span>
            </div>
          </div>
        </div>
      )}

      {measurements.length === 0 && (
        <div className="text-center py-6">
          <Gauge className="h-6 w-6 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">Nog geen metingen ingevoerd</p>
          <p className="text-[10px] text-muted-foreground/60 mt-0.5">Voer weerstandswaarden in bij elke diepte</p>
        </div>
      )}
    </div>
  );
}

function DepthRowComponent({ row, onUpdate, onDelete, isLowest, disabled }: {
  row: DepthRow;
  onUpdate: (id: string, depth: number, resistance: number) => void;
  onDelete: (id: string) => void;
  isLowest: boolean;
  disabled?: boolean;
}) {
  const [depth, setDepth] = useState(String(row.depth_meters));
  const [resistance, setResistance] = useState(row.resistance_value > 0 ? String(row.resistance_value) : '');
  const resistanceRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDepth(String(row.depth_meters));
    setResistance(row.resistance_value > 0 ? String(row.resistance_value) : '');
  }, [row.depth_meters, row.resistance_value]);

  const handleBlur = useCallback(() => {
    const d = parseFloat(depth);
    const r = parseFloat(resistance) || 0;
    if (!isNaN(d) && row.id && (d !== row.depth_meters || r !== row.resistance_value)) {
      onUpdate(row.id, d, r);
    }
  }, [depth, resistance, row, onUpdate]);

  const hasValue = resistance !== '' && parseFloat(resistance) > 0;

  return (
    <div className={cn(
      'grid grid-cols-[60px_1fr_44px] sm:grid-cols-[80px_1fr_44px] gap-1 items-center rounded-lg px-1 py-0.5 transition-colors',
      isLowest && 'bg-accent/8',
    )}>
      <div className="relative">
        <Input
          type="number"
          inputMode="decimal"
          step="0.1"
          value={depth}
          onChange={e => setDepth(e.target.value)}
          onBlur={handleBlur}
          className={cn(
            'h-10 sm:h-9 text-sm pr-6',
            isLowest && 'font-semibold text-accent'
          )}
          disabled={disabled}
        />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground pointer-events-none">m</span>
      </div>
      <Input
        ref={resistanceRef}
        type="number"
        inputMode="decimal"
        step="0.01"
        value={resistance}
        onChange={e => setResistance(e.target.value)}
        onBlur={handleBlur}
        placeholder="—"
        className={cn(
          'h-10 sm:h-9 text-sm',
          isLowest && 'font-semibold text-accent border-accent/30',
          hasValue ? '' : 'text-muted-foreground'
        )}
        disabled={disabled}
      />
      <Button
        size="sm"
        variant="ghost"
        onClick={() => row.id && onDelete(row.id)}
        disabled={disabled}
        className="h-10 sm:h-9 w-10 sm:w-9 p-0 text-muted-foreground/40 hover:text-destructive"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
