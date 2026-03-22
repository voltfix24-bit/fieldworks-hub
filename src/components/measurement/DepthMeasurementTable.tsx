import { useState, useEffect, useCallback, useRef } from 'react';
import { Trash2, ArrowDown, Gauge, AlertTriangle } from 'lucide-react';
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

/**
 * Check if a row's resistance is higher than the previous filled row.
 * Returns the set of row IDs that violate the "deeper = lower resistance" rule.
 */
export function getDepthProgressionWarnings(measurements: DepthRow[]): Set<string> {
  const warnings = new Set<string>();
  const sorted = [...measurements].sort((a, b) => a.depth_meters - b.depth_meters);
  let prevValue: number | null = null;

  for (const m of sorted) {
    if (m.resistance_value > 0) {
      if (prevValue !== null && m.resistance_value > prevValue) {
        if (m.id) warnings.add(m.id);
      }
      prevValue = m.resistance_value;
    }
  }
  return warnings;
}

/**
 * Detect gaps: a row has a value while an earlier row is still empty.
 */
function getGatenWarnings(measurements: DepthRow[]): Set<string> {
  const warnings = new Set<string>();
  const sorted = [...measurements].sort((a, b) => a.depth_meters - b.depth_meters);

  let eersteLeeg: number | null = null;

  for (const m of sorted) {
    const heeftWaarde = m.resistance_value > 0;

    if (!heeftWaarde && eersteLeeg === null) {
      eersteLeeg = m.depth_meters;
    }

    if (heeftWaarde && eersteLeeg !== null) {
      if (m.id) warnings.add(m.id);
    }
  }

  return warnings;
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

  // Depth progression validation
  const warningIds = getDepthProgressionWarnings(measurements);

  // Gap validation
  const gatenWarningIds = getGatenWarnings(measurements);

  // Sort measurements by depth
  const sortedMeasurements = [...measurements].sort((a, b) => a.depth_meters - b.depth_meters);

  return (
    <div className="space-y-0 overflow-x-hidden max-w-full">
      {/* Measurement rows */}
      <div className="rounded-lg overflow-hidden border border-border/30">
        {sortedMeasurements.map((m, idx) => (
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
            hasProgressionWarning={m.id ? warningIds.has(m.id) : false}
            heeftGatWaarschuwing={m.id ? gatenWarningIds.has(m.id) : false}
          />
        ))}
      </div>

      {/* Add deeper action */}
      <button
        onMouseDown={(e) => {
          e.preventDefault();
          (document.activeElement as HTMLElement)?.blur();
          onAdd(nextDepth, 0);
        }}
        disabled={disabled}
        className={cn(
          'w-full flex items-center justify-center gap-1.5',
          'rounded-md border border-dashed border-border/30',
          'font-semibold text-muted-foreground/50',
          'hover:border-primary/30 hover:text-primary hover:bg-primary/3',
          'transition-all duration-150 active:scale-[0.997]',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          compact ? 'py-1.5 text-[10px] mt-0.5 min-h-[30px]' : 'py-2.5 text-[12px] mt-1.5 min-h-[40px]'
        )}
      >
        <ArrowDown className={cn(compact ? 'h-2.5 w-2.5' : 'h-3 w-3')} />
        Dieper — {nextDepth}m
      </button>

      {/* Inline RA summary */}
      {lowestIsValid && (
        <div className={cn(
          'flex items-center gap-2 rounded-md bg-[hsl(var(--measure-lowest)/0.05)] border border-[hsl(var(--measure-lowest)/0.1)]',
          compact ? 'px-2.5 py-1.5 mt-1' : 'px-3 py-2 mt-1.5'
        )}>
          <Gauge className={cn('text-[hsl(var(--measure-lowest))] shrink-0', compact ? 'h-3.5 w-3.5' : 'h-3.5 w-3.5')} />
          <span className={cn('font-bold text-[hsl(var(--measure-lowest))] tabular-nums', compact ? 'text-[12px]' : 'text-[12px]')}>{formatNlNumber(lowestResistance!)} Ω</span>
          <span className={cn('text-muted-foreground/60 font-semibold', compact ? 'text-[10px]' : 'text-[10px]')}>laagst</span>
          <span className={cn('ml-auto text-muted-foreground/50 tabular-nums font-medium', compact ? 'text-[10px]' : 'text-[10px]')}>{filledCount}/{measurements.length}</span>
        </div>
      )}

      {/* Progression warnings summary */}
      {warningIds.size > 0 && (
        <div className={cn(
          'flex items-start gap-2 rounded-md bg-amber-500/5 border border-amber-500/15',
          compact ? 'px-2.5 py-1.5 mt-1' : 'px-3 py-2 mt-1.5'
        )}>
          <AlertTriangle className={cn('text-amber-500 shrink-0 mt-0.5', compact ? 'h-3 w-3' : 'h-3.5 w-3.5')} />
          <span className={cn('text-amber-700 dark:text-amber-400 font-medium leading-snug', compact ? 'text-[10px]' : 'text-[11px]')}>
            {warningIds.size === 1
              ? 'Let op: 1 waarde is hoger dan de vorige diepte'
              : `Let op: ${warningIds.size} waarden zijn hoger dan de vorige diepte`}
          </span>
        </div>
      )}

      {/* Gap warnings summary */}
      {gatenWarningIds.size > 0 && (
        <div className={cn(
          'flex items-start gap-2 rounded-md bg-amber-500/5 border border-amber-500/15',
          compact ? 'px-2.5 py-1.5 mt-1' : 'px-3 py-2 mt-1.5'
        )}>
          <AlertTriangle className={cn('text-amber-500 shrink-0 mt-0.5', compact ? 'h-3 w-3' : 'h-3.5 w-3.5')} />
          <span className={cn('text-amber-700 dark:text-amber-400 font-medium leading-snug', compact ? 'text-[10px]' : 'text-[11px]')}>
            Let op: er zijn dieptes overgeslagen. Controleer of dit klopt.
          </span>
        </div>
      )}

      {measurements.length === 0 && (
        <div className="text-center py-6">
          <div className="w-8 h-8 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-1.5">
            <GroundingIcon size={14} className="text-muted-foreground/25" />
          </div>
          <p className="text-[12px] font-medium text-muted-foreground/60">Nog geen metingen</p>
        </div>
      )}
    </div>
  );
}

function DepthRowComponent({ row, onUpdate, onDelete, isLowest, disabled, isEven, compact, isPreset, hasProgressionWarning, heeftGatWaarschuwing }: {
  row: DepthRow;
  onUpdate: (id: string, depth: number, resistance: number) => void;
  onDelete: (id: string) => void;
  isLowest: boolean;
  disabled?: boolean;
  isEven?: boolean;
  compact?: boolean;
  isPreset?: boolean;
  hasProgressionWarning?: boolean;
  heeftGatWaarschuwing?: boolean;
}) {
  const [resistance, setResistance] = useState(row.resistance_value > 0 ? String(row.resistance_value).replace('.', ',') : '');
  const [isFocused, setIsFocused] = useState(false);
  const [saved, setSaved] = useState(false);
  const resistanceRef = useRef<HTMLInputElement>(null);
  const rijRef = useRef<HTMLDivElement>(null);


  // Swipe-to-delete state
  const [swipeX, setSwipeX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const startX = useRef(0);
  const DELETE_THRESHOLD = 80;

  useEffect(() => {
    setResistance(row.resistance_value > 0 ? String(row.resistance_value).replace('.', ',') : '');
  }, [row.resistance_value]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    const r = parseNlNumberOrZero(resistance);
    if (row.id && r !== row.resistance_value) {
      onUpdate(row.id, row.depth_meters, r);
      // Haptic feedback
      if (navigator.vibrate) navigator.vibrate(6);
      // Visual flash
      setSaved(true);
      setTimeout(() => setSaved(false), 600);
    }
  }, [resistance, row.id, row.depth_meters, row.resistance_value, onUpdate]);

  const hasValue = resistance !== '' && parseNlNumber(resistance) > 0;
  const canSwipe = !isPreset && !disabled;

  return (
    <div
      ref={rijRef}
      className={cn(
        'transition-colors duration-75 relative',
        hasProgressionWarning && !isFocused && 'border-l-2 border-l-amber-400',
        heeftGatWaarschuwing && !hasProgressionWarning && !isFocused && 'border-l-2 border-l-amber-300',
      )}
    >
      {/* Swipe delete background */}
      {canSwipe && swipeX > 10 && (
        <div className="absolute inset-0 flex items-center justify-end px-4 bg-destructive/90 rounded-sm">
          <Trash2 className="h-4 w-4 text-white" />
        </div>
      )}

      <div
        className={cn(
          'grid items-center relative',
          compact
            ? 'grid-cols-[52px_1fr_32px] gap-0 px-1 min-h-[52px]'
            : 'grid-cols-[64px_1fr_40px] gap-2 px-2 min-h-[56px]',
          isEven ? 'bg-card' : 'bg-muted/20',
          isLowest && 'bg-[hsl(var(--measure-lowest)/0.05)]',
          hasProgressionWarning && 'bg-amber-500/[0.04]',
          isFocused && 'bg-[hsl(var(--tenant-primary,var(--primary))/0.04)] ring-1 ring-inset ring-[hsl(var(--tenant-primary,var(--primary))/0.15)]',
          saved && 'bg-[hsl(var(--status-completed)/0.08)] transition-colors duration-300',
        )}
        style={canSwipe ? {
          transform: `translateX(-${swipeX}px)`,
          transition: swiping ? 'none' : 'transform 0.2s ease',
        } : undefined}
        onTouchStart={canSwipe ? (e) => {
          startX.current = e.touches[0].clientX;
          setSwiping(true);
        } : undefined}
        onTouchMove={canSwipe ? (e) => {
          const dx = startX.current - e.touches[0].clientX;
          if (dx > 0) setSwipeX(Math.min(dx, 100));
        } : undefined}
        onTouchEnd={canSwipe ? () => {
          if (swipeX >= DELETE_THRESHOLD && row.id) {
            if (navigator.vibrate) navigator.vibrate(10);
            onDelete(row.id);
          } else {
            setSwipeX(0);
          }
          setSwiping(false);
        } : undefined}
      >
        {/* Depth — static display */}
        <div className="relative">
          <span className={cn(
            'block text-center tabular-nums leading-none',
            compact ? 'text-[15px] font-bold py-3' : 'text-[16px] font-bold py-3',
            isLowest ? 'text-[hsl(var(--measure-lowest))] font-bold' : hasValue ? 'text-foreground/80' : 'text-muted-foreground/45'
          )}>
            {row.depth_meters}
          </span>
          <span className={cn(
            'absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground/40 pointer-events-none',
            compact ? 'text-[10px] font-semibold' : 'text-[10px] font-semibold'
          )}>m</span>
        </div>

        {/* Resistance — the main input, accepts comma */}
        <div className="relative">
          <input
            ref={resistanceRef}
            type="text"
            inputMode="decimal"
            pattern="[0-9]*[.,]?[0-9]*"
            value={resistance}
            onChange={e => setResistance(e.target.value)}
            onFocus={(e) => {
              setIsFocused(true);
              e.target.select();
              setTimeout(() => {
                rijRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 300);
            }}
            onBlur={handleBlur}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || (e.key === 'Tab' && !e.shiftKey)) {
                e.preventDefault();
                (e.target as HTMLInputElement).blur();
                const alleInputs = Array.from(
                  document.querySelectorAll('.depth-measurement-input')
                ) as HTMLInputElement[];
                const huidigeIndex = alleInputs.indexOf(e.target as HTMLInputElement);
                const volgende = alleInputs[huidigeIndex + 1];
                if (volgende) {
                  setTimeout(() => {
                    volgende.focus();
                    volgende.select();
                  }, 50);
                }
              }
            }}
            placeholder="—"
            className={cn(
              'w-full bg-transparent outline-none border-0 depth-measurement-input',
              compact ? 'h-12 text-[16px] pr-4 px-3' : 'h-12 text-[16px] pr-5 px-3.5',
              isLowest && 'font-bold text-[hsl(var(--measure-lowest))]',
              hasProgressionWarning && !isLowest && 'text-amber-700 dark:text-amber-400',
              hasValue ? 'text-foreground font-semibold' : 'text-muted-foreground/30',
              'placeholder:text-muted-foreground/25'
            )}
            disabled={disabled}
          />
          <span className={cn(
            'absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground/40 pointer-events-none font-semibold',
            compact ? 'text-[9px]' : 'text-[9px]'
          )}>Ω</span>
          {toonSuggestie && isFocused && (
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                setResistance(String(toonSuggestie).replace('.', ','));
              }}
              className="absolute -bottom-5 left-0 text-[9px] text-[hsl(var(--tenant-primary,var(--primary)))] font-medium whitespace-nowrap z-10"
            >
              Bedoel je {String(toonSuggestie).replace('.', ',')}?
            </button>
          )}
        </div>

        {/* Delete / warning icon */}
        <div className="flex justify-center">
          {hasProgressionWarning ? (
            <div className="min-h-[44px] min-w-[44px] flex items-center justify-center">
              <AlertTriangle className={cn('text-amber-500', compact ? 'h-3 w-3' : 'h-3.5 w-3.5')} />
            </div>
          ) : !isPreset ? (
            <button
              onClick={() => row.id && onDelete(row.id)}
              disabled={disabled}
              className={cn(
                'text-muted-foreground/15 hover:text-destructive transition-colors rounded',
                'min-h-[44px] min-w-[44px] flex items-center justify-center p-2'
              )}
            >
              <Trash2 className={cn(compact ? 'h-3 w-3' : 'h-3.5 w-3.5')} />
            </button>
          ) : (
            <span className="min-w-[44px]" />
          )}
        </div>
      </div>

      {/* Inline warning text */}
      {hasProgressionWarning && (
        <div className={cn(
          'flex items-center gap-1.5 bg-amber-500/[0.04]',
          compact ? 'px-2 py-0.5 text-[9px]' : 'px-3 py-1 text-[10px]',
        )}>
          <span className="text-amber-600 dark:text-amber-400 font-medium">
            Let op: waarde is hoger dan vorige diepte
          </span>
        </div>
      )}
    </div>
  );
}
