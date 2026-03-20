import { useState, useEffect, useCallback, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Trash2, ArrowDown, Gauge } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GroundingIcon } from './GroundingIcon';
import { parseNlNumber, parseNlNumberOrZero, formatNlNumber } from '@/lib/nl-number';

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

const PRESET_DEPTHS = new Set([3, 6, 9, 12, 15, 18, 21, 24, 27, 30]);

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
      {/* Measurement rows */}
      <div className="rounded-lg overflow-hidden border border-border/30">
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
            isPreset={PRESET_DEPTHS.has(m.depth_meters)}
          />
        ))}
      </div>

      {/* Add deeper action */}
      <button
        onClick={() => onAdd(nextDepth, 0)}
        disabled={disabled}
        className={cn(
          'w-full flex items-center justify-center gap-1',
          'rounded-md border border-dashed border-border/30',
          'font-medium text-muted-foreground/50',
          'hover:border-primary/30 hover:text-primary hover:bg-primary/3',
          'transition-all duration-150 active:scale-[0.997]',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          compact ? 'py-1 text-[9px] mt-0.5 min-h-[26px]' : 'py-2.5 text-[12px] mt-1.5 min-h-[40px]'
        )}
      >
        <ArrowDown className={cn(compact ? 'h-2 w-2' : 'h-3 w-3')} />
        Dieper — {nextDepth}m
      </button>

      {/* Inline RA summary */}
      {lowestIsValid && (
        <div className={cn(
          'flex items-center gap-2 rounded-md bg-[hsl(var(--measure-lowest)/0.04)] border border-[hsl(var(--measure-lowest)/0.08)]',
          compact ? 'px-2 py-1 mt-1' : 'px-3 py-2 mt-1.5'
        )}>
          <Gauge className={cn('text-[hsl(var(--measure-lowest))] shrink-0', compact ? 'h-2.5 w-2.5' : 'h-3.5 w-3.5')} />
          <span className={cn('font-semibold text-[hsl(var(--measure-lowest))] tabular-nums', compact ? 'text-[10px]' : 'text-[11px]')}>{formatNlNumber(lowestResistance!)} Ω</span>
          <span className={cn('text-muted-foreground/40', compact ? 'text-[8px]' : 'text-[10px]')}>laagst</span>
          <span className={cn('ml-auto text-muted-foreground/35 tabular-nums', compact ? 'text-[8px]' : 'text-[10px]')}>{filledCount}/{measurements.length}</span>
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

function DepthRowComponent({ row, onUpdate, onDelete, isLowest, disabled, isEven, compact, isPreset }: {
  row: DepthRow;
  onUpdate: (id: string, depth: number, resistance: number) => void;
  onDelete: (id: string) => void;
  isLowest: boolean;
  disabled?: boolean;
  isEven?: boolean;
  compact?: boolean;
  isPreset?: boolean;
}) {
  const [resistance, setResistance] = useState(row.resistance_value > 0 ? String(row.resistance_value).replace('.', ',') : '');
  const [isFocused, setIsFocused] = useState(false);
  const resistanceRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setResistance(row.resistance_value > 0 ? String(row.resistance_value).replace('.', ',') : '');
  }, [row.resistance_value]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    const r = parseNlNumberOrZero(resistance);
    if (row.id && r !== row.resistance_value) {
      onUpdate(row.id, row.depth_meters, r);
    }
  }, [resistance, row.id, row.depth_meters, row.resistance_value, onUpdate]);

  const hasValue = resistance !== '' && parseNlNumber(resistance) > 0;

  return (
    <div className={cn(
      'grid items-center transition-colors duration-75',
      compact
        ? 'grid-cols-[38px_1fr_24px] gap-0 px-0.5'
        : 'grid-cols-[52px_1fr_36px] sm:grid-cols-[64px_1fr_36px] gap-1.5 px-1.5',
      isEven ? 'bg-card' : 'bg-muted/20',
      isLowest && 'bg-[hsl(var(--measure-lowest)/0.05)]',
      isFocused && 'bg-[hsl(var(--tenant-primary,var(--primary))/0.04)] ring-1 ring-inset ring-[hsl(var(--tenant-primary,var(--primary))/0.12)]',
    )}>
      {/* Depth — static display */}
      <div className="relative">
        <span className={cn(
          'block text-center tabular-nums font-medium leading-none',
          compact ? 'text-[10px] py-1.5' : 'text-[12px] py-2.5',
          isLowest ? 'text-[hsl(var(--measure-lowest))] font-semibold' : 'text-muted-foreground/60'
        )}>
          {row.depth_meters}
        </span>
        <span className={cn(
          'absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground/30 pointer-events-none font-medium',
          compact ? 'text-[7px]' : 'text-[9px]'
        )}>m</span>
      </div>

      {/* Resistance — the main input, accepts comma */}
      <div className="relative">
        <input
          ref={resistanceRef}
          type="text"
          inputMode="decimal"
          value={resistance}
          onChange={e => setResistance(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          placeholder="—"
          className={cn(
            'w-full bg-transparent outline-none border-0',
            compact ? 'h-6 text-[11px] pr-3 px-1' : 'h-9 text-[12px] pr-5 px-2',
            isLowest && 'font-semibold text-[hsl(var(--measure-lowest))]',
            hasValue ? 'text-foreground font-medium' : 'text-muted-foreground/25',
            'placeholder:text-muted-foreground/20'
          )}
          disabled={disabled}
        />
        <span className={cn(
          'absolute right-0.5 top-1/2 -translate-y-1/2 text-muted-foreground/30 pointer-events-none font-medium',
          compact ? 'text-[7px]' : 'text-[9px]'
        )}>Ω</span>
      </div>

      {/* Delete — only for non-preset rows */}
      <div className="flex justify-center">
        {!isPreset ? (
          <button
            onClick={() => row.id && onDelete(row.id)}
            disabled={disabled}
            className={cn(
              'text-muted-foreground/15 hover:text-destructive transition-colors rounded',
              compact ? 'h-5 w-5 flex items-center justify-center' : 'h-8 w-8 flex items-center justify-center'
            )}
          >
            <Trash2 className={cn(compact ? 'h-2.5 w-2.5' : 'h-3 w-3')} />
          </button>
        ) : (
          <span className={cn(compact ? 'w-5' : 'w-8')} />
        )}
      </div>
    </div>
  );
}
