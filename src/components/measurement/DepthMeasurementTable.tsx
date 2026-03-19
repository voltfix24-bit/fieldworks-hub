import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, ArrowDown, Gauge } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GroundingIcon } from './GroundingIcon';

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
  const lowestResistance = measurements.length > 0
    ? Math.min(...measurements.filter(m => m.resistance_value > 0).map(m => m.resistance_value))
    : null;
  const lowestIsValid = lowestResistance !== null && lowestResistance !== Infinity;

  const maxDepth = measurements.length > 0
    ? Math.max(...measurements.map(m => m.depth_meters))
    : 27;
  const nextDepth = maxDepth > 0 ? maxDepth + 3 : 33;

  const filledCount = measurements.filter(m => m.resistance_value > 0).length;

  return (
    <div className="space-y-0">
      {/* Column header */}
      <div className="grid grid-cols-[52px_1fr_36px] sm:grid-cols-[64px_1fr_36px] gap-1.5 px-2 pb-1.5">
        <span className="text-[9px] uppercase tracking-widest font-semibold text-muted-foreground/50">Diepte</span>
        <span className="text-[9px] uppercase tracking-widest font-semibold text-muted-foreground/50">Weerstand</span>
        <span />
      </div>

      {/* Measurement rows */}
      <div className="rounded-xl overflow-hidden border border-border/50 bg-card">
        {measurements.map((m, idx) => (
          <DepthRowComponent
            key={m.id}
            row={m}
            onUpdate={onUpdate}
            onDelete={onDelete}
            isLowest={lowestIsValid && m.resistance_value === lowestResistance && m.resistance_value > 0}
            disabled={disabled}
            isEven={idx % 2 === 0}
          />
        ))}
      </div>

      {/* Add deeper action */}
      <button
        onClick={() => onAdd(nextDepth, 0)}
        disabled={disabled}
        className={cn(
          'w-full flex items-center justify-center gap-2 py-2.5 mt-2',
          'rounded-lg border border-dashed border-border/50',
          'text-[12px] font-medium text-muted-foreground/70',
          'hover:border-primary/30 hover:text-primary hover:bg-primary/3',
          'transition-all duration-150 active:scale-[0.997]',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          'min-h-[40px]'
        )}
      >
        <ArrowDown className="h-3 w-3" />
        Dieper slaan — {nextDepth}m
      </button>

      {/* Inline RA summary */}
      {lowestIsValid && (
        <div className="flex items-center gap-2.5 mt-2.5 px-3 py-2 rounded-lg bg-[hsl(var(--measure-lowest)/0.05)] border border-[hsl(var(--measure-lowest)/0.1)]">
          <Gauge className="h-3.5 w-3.5 text-[hsl(var(--measure-lowest))] shrink-0" />
          <span className="text-[11px] font-semibold text-[hsl(var(--measure-lowest))] tabular-nums">{lowestResistance!.toFixed(2)} Ω</span>
          <span className="text-[10px] text-muted-foreground/50">laagst</span>
          <span className="ml-auto text-[10px] text-muted-foreground/40 tabular-nums">{filledCount}/{measurements.length}</span>
        </div>
      )}

      {measurements.length === 0 && (
        <div className="text-center py-8">
          <div className="w-10 h-10 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-2">
            <GroundingIcon size={16} className="text-muted-foreground/25" />
          </div>
          <p className="text-[12px] font-medium text-muted-foreground/60">Nog geen metingen</p>
        </div>
      )}
    </div>
  );
}

function DepthRowComponent({ row, onUpdate, onDelete, isLowest, disabled, isEven }: {
  row: DepthRow;
  onUpdate: (id: string, depth: number, resistance: number) => void;
  onDelete: (id: string) => void;
  isLowest: boolean;
  disabled?: boolean;
  isEven?: boolean;
}) {
  const [depth, setDepth] = useState(String(row.depth_meters));
  const [resistance, setResistance] = useState(row.resistance_value > 0 ? String(row.resistance_value) : '');

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
  }, [depth, resistance, row.id, row.depth_meters, row.resistance_value, onUpdate]);

  const hasValue = resistance !== '' && parseFloat(resistance) > 0;

  return (
    <div className={cn(
      'grid grid-cols-[52px_1fr_36px] sm:grid-cols-[64px_1fr_36px] gap-1.5 items-center px-1.5 transition-colors duration-100',
      isEven ? 'bg-card' : 'bg-[hsl(var(--measure-surface))]',
      isLowest && 'bg-[hsl(var(--measure-lowest)/0.06)]',
    )}>
      {/* Depth */}
      <div className="relative py-1">
        <Input
          type="number"
          inputMode="decimal"
          step="0.1"
          value={depth}
          onChange={e => setDepth(e.target.value)}
          onBlur={handleBlur}
          className={cn(
            'h-9 text-[12px] pr-5 text-center border-0 bg-transparent shadow-none',
            'focus-visible:ring-1 focus-visible:ring-primary/30 focus-visible:bg-card',
            isLowest && 'font-semibold text-[hsl(var(--measure-lowest))]'
          )}
          disabled={disabled}
        />
        <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-muted-foreground/40 pointer-events-none font-medium">m</span>
      </div>

      {/* Resistance */}
      <div className="relative py-1">
        <Input
          type="number"
          inputMode="decimal"
          step="0.01"
          value={resistance}
          onChange={e => setResistance(e.target.value)}
          onBlur={handleBlur}
          placeholder="—"
          className={cn(
            'h-9 text-[12px] pr-5 border-0 bg-transparent shadow-none',
            'focus-visible:ring-1 focus-visible:ring-primary/30 focus-visible:bg-card',
            isLowest && 'font-semibold text-[hsl(var(--measure-lowest))]',
            hasValue ? 'text-foreground' : 'text-muted-foreground/30'
          )}
          disabled={disabled}
        />
        <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-muted-foreground/40 pointer-events-none font-medium">Ω</span>
      </div>

      {/* Delete */}
      <Button
        size="icon"
        variant="ghost"
        onClick={() => row.id && onDelete(row.id)}
        disabled={disabled}
        className="h-8 w-8 text-muted-foreground/20 hover:text-destructive hover:bg-destructive/8 transition-colors"
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}
