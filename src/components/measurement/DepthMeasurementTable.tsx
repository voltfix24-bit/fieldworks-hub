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
  compact?: boolean;
}

export function DepthMeasurementTable({ measurements, onAdd, onUpdate, onDelete, disabled, compact }: DepthMeasurementTableProps) {
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
      <div className={cn(
        'grid gap-1 px-1.5',
        compact
          ? 'grid-cols-[44px_1fr_28px] pb-1'
          : 'grid-cols-[52px_1fr_36px] sm:grid-cols-[64px_1fr_36px] gap-1.5 pb-1.5'
      )}>
        <span className={cn(
          'uppercase tracking-widest font-semibold text-muted-foreground/50',
          compact ? 'text-[8px]' : 'text-[9px]'
        )}>Diepte</span>
        <span className={cn(
          'uppercase tracking-widest font-semibold text-muted-foreground/50',
          compact ? 'text-[8px]' : 'text-[9px]'
        )}>Weerstand</span>
        <span />
      </div>

      {/* Measurement rows */}
      <div className="rounded-lg overflow-hidden border border-border/40 bg-card">
        {measurements.map((m, idx) => (
          <DepthRowComponent
            key={m.id}
            row={m}
            onUpdate={onUpdate}
            onDelete={onDelete}
            isLowest={lowestIsValid && m.resistance_value === lowestResistance && m.resistance_value > 0}
            disabled={disabled}
            isEven={idx % 2 === 0}
            compact={compact}
          />
        ))}
      </div>

      {/* Add deeper action */}
      <button
        onClick={() => onAdd(nextDepth, 0)}
        disabled={disabled}
        className={cn(
          'w-full flex items-center justify-center gap-1.5 mt-1.5',
          'rounded-md border border-dashed border-border/40',
          'font-medium text-muted-foreground/60',
          'hover:border-primary/30 hover:text-primary hover:bg-primary/3',
          'transition-all duration-150 active:scale-[0.997]',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          compact ? 'py-1.5 text-[10px] min-h-[30px]' : 'py-2.5 text-[12px] min-h-[40px]'
        )}
      >
        <ArrowDown className={cn(compact ? 'h-2.5 w-2.5' : 'h-3 w-3')} />
        Dieper slaan — {nextDepth}m
      </button>

      {/* Inline RA summary */}
      {lowestIsValid && (
        <div className={cn(
          'flex items-center gap-2 mt-1.5 rounded-md bg-[hsl(var(--measure-lowest)/0.05)] border border-[hsl(var(--measure-lowest)/0.1)]',
          compact ? 'px-2 py-1' : 'px-3 py-2'
        )}>
          <Gauge className={cn('text-[hsl(var(--measure-lowest))] shrink-0', compact ? 'h-3 w-3' : 'h-3.5 w-3.5')} />
          <span className={cn('font-semibold text-[hsl(var(--measure-lowest))] tabular-nums', compact ? 'text-[10px]' : 'text-[11px]')}>{lowestResistance!.toFixed(2)} Ω</span>
          <span className={cn('text-muted-foreground/50', compact ? 'text-[8px]' : 'text-[10px]')}>laagst</span>
          <span className={cn('ml-auto text-muted-foreground/40 tabular-nums', compact ? 'text-[8px]' : 'text-[10px]')}>{filledCount}/{measurements.length}</span>
        </div>
      )}

      {measurements.length === 0 && (
        <div className="text-center py-6">
          <div className="w-8 h-8 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-1.5">
            <GroundingIcon size={14} className="text-muted-foreground/25" />
          </div>
          <p className="text-[11px] font-medium text-muted-foreground/60">Nog geen metingen</p>
        </div>
      )}
    </div>
  );
}

function DepthRowComponent({ row, onUpdate, onDelete, isLowest, disabled, isEven, compact }: {
  row: DepthRow;
  onUpdate: (id: string, depth: number, resistance: number) => void;
  onDelete: (id: string) => void;
  isLowest: boolean;
  disabled?: boolean;
  isEven?: boolean;
  compact?: boolean;
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
      'grid items-center transition-colors duration-100',
      compact
        ? 'grid-cols-[44px_1fr_28px] gap-0.5 px-1'
        : 'grid-cols-[52px_1fr_36px] sm:grid-cols-[64px_1fr_36px] gap-1.5 px-1.5',
      isEven ? 'bg-card' : 'bg-[hsl(var(--measure-surface))]',
      isLowest && 'bg-[hsl(var(--measure-lowest)/0.06)]',
    )}>
      <div className={cn('relative', compact ? 'py-0.5' : 'py-1')}>
        <Input
          type="number"
          inputMode="decimal"
          step="0.1"
          value={depth}
          onChange={e => setDepth(e.target.value)}
          onBlur={handleBlur}
          className={cn(
            'text-center border-0 bg-transparent shadow-none',
            'focus-visible:ring-1 focus-visible:ring-primary/30 focus-visible:bg-card',
            compact ? 'h-7 text-[11px] pr-4' : 'h-9 text-[12px] pr-5',
            isLowest && 'font-semibold text-[hsl(var(--measure-lowest))]'
          )}
          disabled={disabled}
        />
        <span className={cn(
          'absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground/40 pointer-events-none font-medium',
          compact ? 'text-[8px]' : 'text-[9px]'
        )}>m</span>
      </div>

      <div className={cn('relative', compact ? 'py-0.5' : 'py-1')}>
        <Input
          type="number"
          inputMode="decimal"
          step="0.01"
          value={resistance}
          onChange={e => setResistance(e.target.value)}
          onBlur={handleBlur}
          placeholder="—"
          className={cn(
            'border-0 bg-transparent shadow-none',
            'focus-visible:ring-1 focus-visible:ring-primary/30 focus-visible:bg-card',
            compact ? 'h-7 text-[11px] pr-4' : 'h-9 text-[12px] pr-5',
            isLowest && 'font-semibold text-[hsl(var(--measure-lowest))]',
            hasValue ? 'text-foreground' : 'text-muted-foreground/30'
          )}
          disabled={disabled}
        />
        <span className={cn(
          'absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground/40 pointer-events-none font-medium',
          compact ? 'text-[8px]' : 'text-[9px]'
        )}>Ω</span>
      </div>

      <Button
        size="icon"
        variant="ghost"
        onClick={() => row.id && onDelete(row.id)}
        disabled={disabled}
        className={cn(
          'text-muted-foreground/15 hover:text-destructive hover:bg-destructive/8 transition-colors',
          compact ? 'h-6 w-6' : 'h-8 w-8'
        )}
      >
        <Trash2 className={cn(compact ? 'h-2.5 w-2.5' : 'h-3 w-3')} />
      </Button>
    </div>
  );
}
