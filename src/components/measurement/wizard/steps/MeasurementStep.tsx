import { useState, useEffect, useCallback } from 'react';
import { DepthMeasurementTable } from '../../DepthMeasurementTable';
import { Input } from '@/components/ui/input';
import { GroundingIcon } from '../../GroundingIcon';
import { Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDepthMeasurements, useCreateDepthMeasurement, useUpdateDepthMeasurement, useDeleteDepthMeasurement } from '@/hooks/use-depth-measurements';

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

  useEffect(() => {
    if (pens.length > 0) {
      setExpandedPenId(pens[pens.length - 1].id);
    }
  }, [pens.length]);

  return (
    <div className={cn('space-y-2', compact ? 'pb-16' : 'pb-24 space-y-4')}>
      {/* ─── RA bar — compact inline ─── */}
      <div className={cn(
        'flex items-center gap-2.5 rounded-lg border border-border/40 bg-card overflow-hidden',
        compact ? 'px-2.5 py-1.5' : 'px-3.5 py-2.5'
      )}>
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <span className={cn(
            'uppercase tracking-widest text-muted-foreground/50 font-semibold shrink-0',
            compact ? 'text-[8px]' : 'text-[10px]'
          )}>RA</span>
          <span className={cn(
            'font-bold tabular-nums leading-none',
            compact ? 'text-[14px]' : 'text-[17px]',
            electrode.ra_value != null ? 'text-primary' : 'text-muted-foreground/25'
          )}>
            {electrode.ra_value != null ? `${Number(electrode.ra_value).toFixed(2)} Ω` : '—'}
          </span>
          {electrode.ra_value != null && (
            <span className="text-[9px] text-muted-foreground/50">laagst</span>
          )}
        </div>
        {hasTarget && (
          <div className={cn(
            'shrink-0 px-2 py-0.5 rounded-md tabular-nums font-semibold',
            compact ? 'text-[11px]' : 'text-[13px]',
            targetMet
              ? 'bg-[hsl(var(--status-completed)/0.08)] text-[hsl(var(--status-completed))]'
              : 'bg-muted/30 text-muted-foreground'
          )}>
            ≤ {Number(electrode.target_value).toFixed(2)} Ω
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
                'mt-2 rounded-lg border border-border/40 bg-muted/5 flex items-center gap-2.5 transition-all duration-200',
                compact ? 'px-2.5 py-2' : 'px-3.5 py-3'
              )}>
                <GroundingIcon size={12} className="text-primary/60 shrink-0" />
                <span className="text-[9px] uppercase tracking-widest text-muted-foreground/50 font-semibold shrink-0">RV</span>
                <Input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  value={electrode.rv_value ?? ''}
                  onChange={e => onUpdateElectrode({ rv_value: e.target.value ? parseFloat(e.target.value) : null })}
                  placeholder="0.00 Ω"
                  className={cn(
                    'font-semibold tabular-nums max-w-[120px] border-0 bg-transparent shadow-none',
                    compact ? 'h-7 text-[12px]' : 'h-9 text-[13px]'
                  )}
                />
                <span className="text-[9px] text-muted-foreground/40 ml-auto hidden sm:inline">gekoppeld</span>
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
          'rounded-lg border border-dashed border-primary/20',
          'text-[12px] font-semibold text-primary/70',
          'hover:bg-primary/4 hover:border-primary/35 hover:text-primary',
          'transition-all duration-150 active:scale-[0.997]',
          compact ? 'py-2.5 min-h-[38px]' : 'py-3.5 min-h-[48px]'
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
        'w-full flex items-center gap-2.5 rounded-lg border border-border/30',
        'bg-muted/5 hover:bg-muted/15 transition-all duration-150',
        'text-left active:scale-[0.998]',
        compact ? 'px-2.5 py-2' : 'px-3.5 py-3'
      )}
    >
      <ChevronRight className="h-3 w-3 text-muted-foreground/35 shrink-0" />
      <span className="text-[11px] font-semibold text-foreground/80 min-w-0 truncate">{pen.pen_code}</span>
      <div className="flex items-center gap-2 shrink-0 ml-auto">
        <span className="text-[10px] text-muted-foreground/45 tabular-nums">{filledCount}/{measurements.length}</span>
        {lowest != null && (
          <span className="text-[10px] font-semibold text-primary/70 tabular-nums">{lowest.toFixed(2)} Ω</span>
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
    <div id={`pen-section-${pen.id}`} className="space-y-1 animate-in fade-in slide-in-from-bottom-1 duration-200">
      {/* Pen header — minimal */}
      <div className="flex items-center gap-2 px-0.5 py-1">
        <ChevronDown className="h-3 w-3 text-primary/40 shrink-0" />
        <span className="text-[11px] font-semibold text-foreground">{pen.pen_code}</span>
        {pen.label && <span className="text-[10px] text-muted-foreground/45">· {pen.label}</span>}
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
