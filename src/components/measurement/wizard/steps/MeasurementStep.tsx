import { useState, useEffect, useCallback } from 'react';
import { getDepthProgressionWarnings } from '../../DepthMeasurementTable';
import { DepthMeasurementTable } from '../../DepthMeasurementTable';
import { GroundingIcon } from '../../GroundingIcon';
import { Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDepthMeasurements, useCreateDepthMeasurement, useUpdateDepthMeasurement, useDeleteDepthMeasurement } from '@/hooks/use-depth-measurements';
import { parseNlNumberOrNull, formatNlNumber } from '@/lib/nl-number';

interface MeasurementStepProps {
  electrode: any;
  pens: any[];
  tenantId: string;
  onUpdateElectrode: (updates: any) => void;
  onAddPen: () => void;
  recalcRa: (electrodeId: string, measurements: any[]) => void;
  depthsInitRef: React.MutableRefObject<Set<string>>;
  initializeDepthRows: (penId: string, pen: any) => void;
  compact?: boolean;
}

export function MeasurementStep({
  electrode, pens, tenantId,
  onUpdateElectrode, onAddPen, recalcRa,
  depthsInitRef, initializeDepthRows, compact,
}: MeasurementStepProps) {
  const showRv = pens.length > 1;
  const hasTarget = electrode.target_value != null;
  const targetMet = hasTarget && electrode.ra_value != null && electrode.ra_value <= electrode.target_value;

  const [expandedPenId, setExpandedPenId] = useState<string | null>(null);
  const [rvInput, setRvInput] = useState('');

  useEffect(() => {
    if (pens.length > 0) {
      setExpandedPenId(pens[pens.length - 1].id);
    }
  }, [pens.length]);

  // Sync RV input with electrode value
  useEffect(() => {
    setRvInput(electrode.rv_value != null ? String(electrode.rv_value).replace('.', ',') : '');
  }, [electrode.rv_value]);

  const handleRvBlur = () => {
    const parsed = parseNlNumberOrNull(rvInput);
    if (parsed !== electrode.rv_value) {
      onUpdateElectrode({ rv_value: parsed });
    }
  };

  return (
    <div className={cn(compact ? 'space-y-2 pb-2' : 'space-y-4 pb-24')}>
      {/* ─── RA insight bar ─── */}
      <div className={cn(
        'flex items-center gap-2.5 rounded-lg border overflow-hidden',
        compact ? 'px-3 py-2' : 'px-3.5 py-2.5',
        electrode.ra_value != null
          ? 'border-[hsl(var(--tenant-primary,var(--primary))/0.2)] bg-[hsl(var(--tenant-primary,var(--primary))/0.04)]'
          : 'border-border/30 bg-card'
      )}>
        <GroundingIcon size={compact ? 13 : 14} className="text-[hsl(var(--tenant-primary,var(--primary))/0.6)] shrink-0" />
        <span className={cn(
          'uppercase tracking-widest font-bold shrink-0',
          compact ? 'text-[9px]' : 'text-[10px]',
          'text-muted-foreground/50'
        )}>RA</span>
        <span className={cn(
          'font-bold tabular-nums leading-none',
          compact ? 'text-[15px]' : 'text-[17px]',
          electrode.ra_value != null ? 'text-[hsl(var(--tenant-primary,var(--primary)))]' : 'text-muted-foreground/20'
        )}>
          {electrode.ra_value != null ? `${formatNlNumber(Number(electrode.ra_value))} Ω` : '—'}
        </span>
        {electrode.ra_value != null && (
          <span className="text-[10px] text-muted-foreground/50 font-medium">laagst</span>
        )}
        {hasTarget && (
          <span className={cn(
            'ml-auto shrink-0 px-2 py-0.5 rounded-md tabular-nums font-bold',
            compact ? 'text-[10px]' : 'text-[12px]',
            targetMet
              ? 'bg-[hsl(var(--status-completed)/0.1)] text-[hsl(var(--status-completed))]'
              : 'bg-muted/30 text-muted-foreground/60'
          )}>
            ≤ {formatNlNumber(Number(electrode.target_value))} Ω
          </span>
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
                compact={compact}
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
                'mt-1.5 rounded-lg border border-border/30 bg-muted/5 flex items-center gap-2.5 transition-all duration-200',
                compact ? 'px-3 py-2' : 'px-3.5 py-3'
              )}>
                <GroundingIcon size={12} className="text-muted-foreground/50 shrink-0" />
                <div className="flex flex-col gap-0 shrink-0">
                  <span className="text-[9px] uppercase tracking-widest text-muted-foreground/50 font-bold leading-none">RV</span>
                  <span className="text-[8px] text-muted-foreground/35 font-medium leading-tight">gekoppeld</span>
                </div>
                <input
                  type="text"
                  inputMode="decimal"
                  value={rvInput}
                  onChange={e => setRvInput(e.target.value)}
                  onBlur={handleRvBlur}
                  placeholder="0,00"
                  className={cn(
                    'bg-transparent outline-none border-0 font-bold tabular-nums max-w-[100px]',
                    compact ? 'h-7 text-[13px]' : 'h-9 text-[14px]',
                    'placeholder:text-muted-foreground/25'
                  )}
                />
                <span className="text-[9px] text-muted-foreground/35 font-semibold">Ω</span>
              </div>
            )}
          </div>
        );
      })}

      {/* ─── Add pen ─── */}
      <button
        onClick={onAddPen}
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
      onClick={onExpand}
      className={cn(
        'w-full flex items-center gap-2.5 rounded-lg border border-border/25',
        'bg-muted/8 hover:bg-muted/20 transition-all duration-150',
        'text-left active:scale-[0.998]',
        compact ? 'px-3 py-2' : 'px-3.5 py-3'
      )}
    >
      <ChevronRight className="h-3 w-3 text-muted-foreground/40 shrink-0" />
      <span className={cn('font-bold text-foreground/70 min-w-0 truncate', compact ? 'text-[11px]' : 'text-[12px]')}>{pen.pen_code}</span>
      <div className="flex items-center gap-2 shrink-0 ml-auto">
        <span className="text-[10px] text-muted-foreground/40 tabular-nums font-medium">{filledCount}/{measurements.length}</span>
        {lowest != null && (
          <span className="text-[10px] font-bold text-[hsl(var(--tenant-primary,var(--primary))/0.7)] tabular-nums">{formatNlNumber(lowest)} Ω</span>
        )}
      </div>
    </button>
  );
}

function PenMeasurementSection({ pen, electrode, tenantId, recalcRa, depthsInitRef, initializeDepthRows, compact }: {
  pen: any; electrode: any; tenantId: string;
  recalcRa: (electrodeId: string, measurements: any[]) => void;
  depthsInitRef: React.MutableRefObject<Set<string>>;
  initializeDepthRows: (penId: string, pen: any) => void;
  compact?: boolean;
}) {
  const { data: measurements = [] } = useDepthMeasurements(pen.id);
  const createMeasurement = useCreateDepthMeasurement();
  const updateMeasurement = useUpdateDepthMeasurement();
  const deleteMeasurement = useDeleteDepthMeasurement();

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
      <div className={cn('flex items-center gap-2', compact ? 'px-1 py-1' : 'px-0.5 py-1')}>
        <ChevronDown className="h-3 w-3 text-[hsl(var(--tenant-primary,var(--primary))/0.4)] shrink-0" />
        <span className={cn('font-bold text-foreground', compact ? 'text-[12px]' : 'text-[13px]')}>{pen.pen_code}</span>
        {pen.label && <span className="text-[10px] text-muted-foreground/50 font-medium">· {pen.label}</span>}
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
