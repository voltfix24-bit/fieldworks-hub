import { useState, useEffect, useCallback } from 'react';
import { getDepthProgressionWarnings } from '../../DepthMeasurementTable';
import { DepthMeasurementTable } from '../../DepthMeasurementTable';
import { GroundingIcon } from '../../GroundingIcon';
import { Plus, ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDepthMeasurements, useCreateDepthMeasurement, useUpdateDepthMeasurement, useDeleteDepthMeasurement } from '@/hooks/use-depth-measurements';
import { parseNlNumberOrNull, formatNlNumber } from '@/lib/nl-number';

interface MeasurementStepProps {
  electrode: any;
  pens: any[];
  tenantId: string;
  onUpdateElectrode: (updates: any) => void;
  onAddPen: () => void;
  onDeletePen?: (penId: string) => void;
  recalcRa: (electrodeId: string, measurements: any[]) => void;
  depthsInitRef: React.MutableRefObject<Set<string>>;
  initializeDepthRows: (penId: string, pen: any) => void;
  compact?: boolean;
  onWarningCountChange?: (count: number) => void;
  onRvMissingChange?: (missing: boolean) => void;
}

export function MeasurementStep({
  electrode, pens, tenantId,
  onUpdateElectrode, onAddPen, onDeletePen, recalcRa,
  depthsInitRef, initializeDepthRows, compact,
  onWarningCountChange, onRvMissingChange,
}: MeasurementStepProps) {
  const showRv = pens.length > 1;
  const hasTarget = electrode.target_value != null;
  const targetMet = hasTarget && (
    showRv
      ? electrode.rv_value != null && electrode.rv_value <= electrode.target_value
      : electrode.ra_value != null && electrode.ra_value <= electrode.target_value
  );
  const rvMissing = showRv && (electrode.rv_value == null || electrode.rv_value === 0);

  const [expandedPenId, setExpandedPenId] = useState<string | null>(null);
  const [rvInput, setRvInput] = useState('');
  const [targetInput, setTargetInput] = useState('');
  const [penWarnings, setPenWarnings] = useState<Record<string, number>>({});

  const handlePenWarnings = useCallback((penId: string, count: number) => {
    setPenWarnings(prev => {
      if (prev[penId] === count) return prev;
      return { ...prev, [penId]: count };
    });
  }, []);

  // Report total warnings to parent
  const totalWarnings = Object.values(penWarnings).reduce((a, b) => a + b, 0);
  useEffect(() => {
    onWarningCountChange?.(totalWarnings);
  }, [totalWarnings, onWarningCountChange]);

  // Report RV missing state to parent
  useEffect(() => {
    onRvMissingChange?.(rvMissing);
  }, [rvMissing, onRvMissingChange]);

  useEffect(() => {
    if (pens.length > 0 && !expandedPenId) {
      setExpandedPenId(pens[pens.length - 1].id);
    }
  }, [pens.length]);

  // Sync RV input with electrode value
  useEffect(() => {
    setRvInput(electrode.rv_value != null ? String(electrode.rv_value).replace('.', ',') : '');
  }, [electrode.rv_value]);

  // Sync target input with electrode value
  useEffect(() => {
    setTargetInput(electrode.target_value != null ? String(electrode.target_value).replace('.', ',') : '');
  }, [electrode.target_value]);

  const handleRvBlur = () => {
    const parsed = parseNlNumberOrNull(rvInput);
    if (parsed !== electrode.rv_value) {
      onUpdateElectrode({ rv_value: parsed, ra_value: null });
    }
  };

  const handleTargetBlur = () => {
    const parsed = parseNlNumberOrNull(targetInput);
    if (parsed !== electrode.target_value) {
      onUpdateElectrode({ target_value: parsed });
    }
  };

  return (
    <div className={cn(compact ? 'space-y-2 pb-2' : 'space-y-4 pb-24')}>
      {/* ─── Toetswaarde invoer ─── */}
      <div className="flex items-center gap-3">
        <span className="text-[11px] font-medium text-muted-foreground/50 uppercase tracking-widest">Toetswaarde</span>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] text-muted-foreground/40">≤</span>
          <input
            type="text"
            inputMode="decimal"
            value={targetInput}
            onChange={e => setTargetInput(e.target.value)}
            onBlur={handleTargetBlur}
            placeholder="3,00"
            className={cn(
              'w-20 rounded-xl border border-border/40 bg-background px-3 py-1.5 text-[13px] text-center font-semibold tabular-nums',
              'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--tenant-primary,var(--primary))/0.3)]',
              'placeholder:text-muted-foreground/30'
            )}
          />
          <span className="text-[12px] text-muted-foreground/45 font-semibold">Ω</span>
        </div>
      </div>

      {/* DEEL 12 — Sticky RA/RV status bar */}
      <div className={cn(
        'flex items-center justify-between rounded-2xl px-4 py-3',
        'sticky top-0 z-20 backdrop-blur-xl bg-background/90 -mx-4 px-4',
        !showRv
          ? electrode.ra_value != null
            ? hasTarget
              ? targetMet
                ? 'bg-[hsl(var(--status-completed)/0.08)]'
                : 'bg-destructive/[0.06]'
              : 'bg-[hsl(var(--tenant-primary,var(--primary))/0.06)]'
            : 'bg-muted/20'
          : rvMissing
            ? 'bg-amber-500/[0.06]'
            : hasTarget
              ? targetMet
                ? 'bg-[hsl(var(--status-completed)/0.08)]'
                : 'bg-destructive/[0.06]'
              : 'bg-[hsl(var(--tenant-primary,var(--primary))/0.06)]'
      )}>
        <div>
          <p className="text-[10px] font-medium text-muted-foreground/40 uppercase tracking-widest">
            {showRv ? 'RV · Verspreidingsweerstand' : 'RA · Aardingsweerstand'}
          </p>
          <p className={cn(
            'text-[20px] font-bold tracking-tight mt-0.5 tabular-nums',
            !showRv
              ? electrode.ra_value != null
                ? hasTarget && !targetMet ? 'text-destructive' : 'text-[hsl(var(--status-completed))]'
                : 'text-muted-foreground/25'
              : rvMissing
                ? 'text-amber-600/70'
                : hasTarget && !targetMet ? 'text-destructive' : 'text-[hsl(var(--status-completed))]'
          )}>
            {!showRv
              ? electrode.ra_value != null ? `${formatNlNumber(Number(electrode.ra_value))} Ω` : '— Ω'
              : rvMissing ? '— Ω' : `${formatNlNumber(Number(electrode.rv_value))} Ω`
            }
          </p>
        </div>
        {hasTarget && (
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground/40">Norm</p>
            <p className="text-[13px] font-semibold text-muted-foreground/60 tabular-nums">
              ≤ {formatNlNumber(Number(electrode.target_value))} Ω
            </p>
            {((!showRv && electrode.ra_value != null) || (showRv && !rvMissing)) && (
              <p className={cn(
                'text-[11px] font-bold mt-0.5',
                targetMet ? 'text-[hsl(var(--status-completed))]' : 'text-destructive'
              )}>
                {targetMet ? '✓ Voldoet' : '✗ Voldoet niet'}
              </p>
            )}
          </div>
        )}
      </div>
      {/* ─── Per-pen measurement sections ─── */}
      {pens.map((pen: any, idx: number) => {
        const isExpanded = expandedPenId === pen.id;
        const isLast = idx === pens.length - 1;

        return (
          <div key={pen.id}>
            {isExpanded ? (
              <PenMeasurementSection
                pen={pen}
                electrode={electrode}
                tenantId={tenantId}
                recalcRa={recalcRa}
                depthsInitRef={depthsInitRef}
                initializeDepthRows={initializeDepthRows}
                onWarningCount={(count) => handlePenWarnings(pen.id, count)}
                compact={compact}
                canDelete={pens.length > 1}
                onDeletePen={onDeletePen}
              />
            ) : (
              <CollapsedPenSummary
                pen={pen}
                electrode={electrode}
                tenantId={tenantId}
                depthsInitRef={depthsInitRef}
                initializeDepthRows={initializeDepthRows}
                onExpand={() => setExpandedPenId(pen.id)}
                compact={compact}
              />
            )}

            {isLast && showRv && (
              <div className={cn(
                'mt-2 rounded-xl border bg-card overflow-hidden',
                compact ? 'p-3' : 'p-4',
                rvMissing ? 'border-amber-400/30' : 'border-border/30'
              )}>
                <label className="text-[11px] uppercase tracking-widest font-bold text-muted-foreground/60 mb-1.5 block">
                  RV-waarde (Ω)
                </label>
                <div className="flex items-center gap-2">
                  <GroundingIcon size={13} className={cn('shrink-0', rvMissing ? 'text-amber-500/60' : 'text-muted-foreground/60')} />
                  <input
                    type="text"
                    inputMode="decimal"
                    value={rvInput}
                    onChange={e => setRvInput(e.target.value)}
                    onBlur={handleRvBlur}
                    placeholder="Bijv. 1,82"
                    className={cn(
                      'flex-1 bg-transparent outline-none border-0 font-bold tabular-nums text-foreground',
                      compact ? 'h-9 text-[15px]' : 'h-10 text-[16px]',
                      'placeholder:text-muted-foreground/30'
                    )}
                  />
                  <span className="text-[12px] text-muted-foreground/45 font-semibold">Ω</span>
                </div>
                {rvMissing && (
                  <p className="text-[11px] text-amber-600 font-medium mt-1.5">
                    Vul de RV-waarde in om door te gaan
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* ─── Add pen ─── */}
      <button
        onMouseDown={(e) => {
          e.preventDefault();
          (document.activeElement as HTMLElement)?.blur();
          setTimeout(onAddPen, 50);
        }}
        className={cn(
          'w-full flex items-center justify-center gap-1.5',
          'rounded-lg border border-dashed border-[hsl(var(--tenant-primary,var(--primary))/0.2)]',
          'text-[12px] font-bold text-[hsl(var(--tenant-primary,var(--primary))/0.6)]',
          'hover:bg-[hsl(var(--tenant-primary,var(--primary))/0.04)] hover:text-[hsl(var(--tenant-primary,var(--primary)))]',
          'transition-all duration-150 active:scale-[0.997]',
          compact ? 'py-2.5 min-h-[36px]' : 'py-3.5 min-h-[48px]'
        )}
      >
        <Plus className="h-3.5 w-3.5" />
        Pen toevoegen
      </button>
    </div>
  );
}

function CollapsedPenSummary({ pen, electrode, tenantId, depthsInitRef, initializeDepthRows, onExpand, compact }: {
  pen: any; electrode: any; tenantId: string;
  depthsInitRef: React.MutableRefObject<Set<string>>;
  initializeDepthRows: (penId: string, pen: any) => void;
  onExpand: () => void; compact?: boolean;
}) {
  const { data: measurements = [] } = useDepthMeasurements(pen.id);

  if (measurements.length === 0 && !depthsInitRef.current.has(pen.id)) {
    initializeDepthRows(pen.id, pen);
  }

  const filledCount = measurements.filter((m: any) => m.resistance_value > 0).length;
  const validValues = measurements.filter((m: any) => m.resistance_value > 0).map((m: any) => m.resistance_value);
  const lowest = validValues.length > 0 ? Math.min(...validValues) : null;

  return (
    <button
      onMouseDown={(e) => {
        e.preventDefault();
        (document.activeElement as HTMLElement)?.blur();
        setTimeout(onExpand, 50);
      }}
      className={cn(
        'w-full flex items-center gap-2.5 rounded-lg border border-border/25',
        'bg-muted/8 hover:bg-muted/20 transition-all duration-150',
        'text-left active:scale-[0.998]',
        compact ? 'px-3 py-2.5' : 'px-3.5 py-3'
      )}
    >
      <ChevronDown className="h-3.5 w-3.5 text-[hsl(var(--tenant-primary,var(--primary))/0.5)] shrink-0 -rotate-90" />
      <span className={cn('font-bold text-foreground/80 min-w-0 truncate', compact ? 'text-[12px]' : 'text-[13px]')}>{pen.pen_code}</span>
      <div className="flex items-center gap-2 shrink-0 ml-auto">
        <span className="text-[10px] text-muted-foreground/50 tabular-nums font-medium">{filledCount}/{measurements.length}</span>
        {lowest != null && (
          <span className="text-[11px] font-bold text-[hsl(var(--tenant-primary,var(--primary))/0.8)] tabular-nums">{formatNlNumber(lowest)} Ω</span>
        )}
        <span className="text-[9px] text-muted-foreground/25 font-medium shrink-0 ml-1">Bewerken</span>
      </div>
    </button>
  );
}

function PenMeasurementSection({ pen, electrode, tenantId, recalcRa, depthsInitRef, initializeDepthRows, onWarningCount, compact, canDelete, onDeletePen }: {
  pen: any; electrode: any; tenantId: string;
  recalcRa: (electrodeId: string, measurements: any[]) => void;
  depthsInitRef: React.MutableRefObject<Set<string>>;
  initializeDepthRows: (penId: string, pen: any) => void;
  onWarningCount?: (count: number) => void;
  compact?: boolean;
  canDelete?: boolean;
  onDeletePen?: (penId: string) => void;
}) {
  const { data: measurements = [] } = useDepthMeasurements(pen.id);
  const createMeasurement = useCreateDepthMeasurement();
  const updateMeasurement = useUpdateDepthMeasurement();
  const deleteMeasurement = useDeleteDepthMeasurement();

  // Report warning count
  const warnings = getDepthProgressionWarnings(measurements);
  useEffect(() => {
    onWarningCount?.(warnings.size);
  }, [warnings.size, onWarningCount]);

  if (measurements.length === 0 && !depthsInitRef.current.has(pen.id)) {
    initializeDepthRows(pen.id, pen);
  }

  const handleAdd = (depth: number, resistance: number) => {
    createMeasurement.mutate({
      tenant_id: tenantId, project_id: pen.project_id,
      measurement_session_id: pen.measurement_session_id,
      electrode_id: pen.electrode_id,
      pen_id: pen.id, depth_meters: depth, resistance_value: resistance,
      sort_order: measurements.length,
    }, {
      onSuccess: () => recalcRa(electrode.id, [...measurements, { resistance_value: resistance }]),
    });
  };

  const handleUpdate = (measurementId: string, depth: number, resistance: number) => {
    updateMeasurement.mutate({ id: measurementId, depth_meters: depth, resistance_value: resistance }, {
      onSuccess: () => recalcRa(electrode.id, measurements.map((m: any) => m.id === measurementId ? { ...m, resistance_value: resistance } : m)),
    });
  };

  const handleDelete = (measurementId: string) => {
    deleteMeasurement.mutate({ id: measurementId, penId: pen.id }, {
      onSuccess: () => recalcRa(electrode.id, measurements.filter((m: any) => m.id !== measurementId)),
    });
  };

  return (
    <div id={`pen-section-${pen.id}`} className="space-y-0.5 animate-in fade-in duration-150">
      <div className={cn(
        'flex items-center gap-2 border-b border-[hsl(var(--tenant-primary,var(--primary))/0.1)]',
        compact ? 'px-1 py-1.5 mb-0.5' : 'px-0.5 py-1.5 mb-1'
      )}>
        <ChevronDown className="h-3.5 w-3.5 text-[hsl(var(--tenant-primary,var(--primary))/0.5)] shrink-0" />
        <span className={cn('font-bold text-foreground', compact ? 'text-[13px]' : 'text-[14px]')}>{pen.pen_code}</span>
        {pen.label && <span className="text-[10px] text-muted-foreground/60 font-medium">· {pen.label}</span>}
        {canDelete && onDeletePen && (
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (window.confirm(`${pen.pen_code} verwijderen? Alle metingen van deze pen gaan verloren.`)) {
                onDeletePen(pen.id);
              }
            }}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium text-destructive/60 hover:bg-destructive/8 active:scale-95 transition-all ml-auto shrink-0"
          >
            <Trash2 className="h-3 w-3" />
            Verwijderen
          </button>
        )}
      </div>

      <DepthMeasurementTable
        measurements={measurements}
        onAdd={handleAdd}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        compact={compact}
      />
    </div>
  );
}
