import { useState, useEffect, useCallback } from 'react';
import { WizardStepHeader } from '../WizardStepHeader';
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
}

export function MeasurementStep({
  electrode, pens, tenantId,
  onUpdateElectrode, onAddPen, recalcRa,
  depthsInitRef, initializeDepthRows,
}: MeasurementStepProps) {
  const showRv = pens.length > 1;
  const hasTarget = electrode.target_value != null;
  const targetMet = hasTarget && electrode.ra_value != null && electrode.ra_value <= electrode.target_value;

  // Track which pen is expanded — default to last pen
  const [expandedPenId, setExpandedPenId] = useState<string | null>(null);

  // Auto-expand the latest pen when pens change
  useEffect(() => {
    if (pens.length > 0) {
      setExpandedPenId(pens[pens.length - 1].id);
    }
  }, [pens.length]);

  const lastPen = pens[pens.length - 1];

  return (
    <div className="space-y-4 pb-24">
      {/* ─── Active context heading ─── */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center shrink-0">
          <GroundingIcon size={18} className="text-primary" />
        </div>
        <div className="min-w-0">
          <h2 className="text-[16px] font-bold text-foreground tracking-tight leading-tight">
            {electrode.electrode_code} / {expandedPenId ? pens.find((p: any) => p.id === expandedPenId)?.pen_code || 'P1' : 'P1'}
          </h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {pens.length} {pens.length === 1 ? 'pen' : 'pennen'} · Voer weerstandswaarden in per diepte
          </p>
        </div>
      </div>

      {/* ─── RA insight block ─── */}
      <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
        <div className="flex items-center gap-3 px-3.5 py-2.5">
          <div className="flex-1 min-w-0">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold block">RA-waarde</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className={cn(
                'text-[17px] font-bold tabular-nums leading-none',
                electrode.ra_value != null ? 'text-primary' : 'text-muted-foreground/25'
              )}>
                {electrode.ra_value != null ? `${Number(electrode.ra_value).toFixed(2)} Ω` : '—'}
              </span>
              {electrode.ra_value != null && (
                <span className="text-[10px] text-muted-foreground/60">laagst gemeten</span>
              )}
            </div>
          </div>
          {hasTarget && (
            <div className={cn(
              'text-right shrink-0 px-2.5 py-1 rounded-lg',
              targetMet ? 'bg-[hsl(var(--status-completed)/0.08)]' : 'bg-muted/30'
            )}>
              <span className="text-[9px] uppercase tracking-widest text-muted-foreground/50 font-medium block">Doel</span>
              <span className={cn(
                'text-[13px] font-semibold tabular-nums',
                targetMet ? 'text-[hsl(var(--status-completed))]' : 'text-muted-foreground'
              )}>
                {Number(electrode.target_value).toFixed(2)} Ω
              </span>
            </div>
          )}
        </div>
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
              />
            ) : (
              <CollapsedPenSummary
                pen={pen}
                electrode={electrode}
                tenantId={tenantId}
                depthsInitRef={depthsInitRef}
                initializeDepthRows={initializeDepthRows}
                onExpand={() => setExpandedPenId(pen.id)}
              />
            )}

            {/* RV block: directly below the last pen */}
            {isLast && showRv && (
              <div className="mt-3 rounded-xl border border-border/50 bg-muted/5 px-3.5 py-3 flex items-start gap-3 transition-all duration-200">
                <div className="w-8 h-8 rounded-lg bg-primary/6 flex items-center justify-center shrink-0 mt-0.5">
                  <GroundingIcon size={14} className="text-primary/70" />
                </div>
                <div className="flex-1 space-y-1.5 min-w-0">
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold block">RV-waarde</span>
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    value={electrode.rv_value ?? ''}
                    onChange={e => onUpdateElectrode({ rv_value: e.target.value ? parseFloat(e.target.value) : null })}
                    placeholder="0.00 Ω"
                    className="h-10 text-[13px] font-semibold max-w-[160px] tabular-nums"
                  />
                  <span className="text-[10px] text-muted-foreground/40">Weerstand van gekoppelde pennen</span>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* ─── Add pen action ─── */}
      <button
        onClick={onAddPen}
        className={cn(
          'w-full flex items-center justify-center gap-2 py-3.5',
          'rounded-xl border border-dashed border-primary/25',
          'text-[13px] font-semibold text-primary/80',
          'hover:bg-primary/4 hover:border-primary/40 hover:text-primary',
          'transition-all duration-200 active:scale-[0.997]',
          'min-h-[48px]'
        )}
      >
        <Plus className="h-4 w-4" />
        Pen toevoegen
      </button>
    </div>
  );
}

/** Collapsed summary for a previous pen */
function CollapsedPenSummary({ pen, electrode, tenantId, depthsInitRef, initializeDepthRows, onExpand }: {
  pen: any;
  electrode: any;
  tenantId: string;
  depthsInitRef: React.MutableRefObject<Set<string>>;
  initializeDepthRows: (penId: string, pen: any) => void;
  onExpand: () => void;
}) {
  const { data: measurements = [] } = useDepthMeasurements(pen.id);

  // Init if needed
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
        'w-full flex items-center gap-3 px-3.5 py-3 rounded-xl border border-border/40',
        'bg-muted/5 hover:bg-muted/15 transition-all duration-200',
        'text-left active:scale-[0.998]'
      )}
    >
      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
      <div className="w-7 h-7 rounded-md bg-muted/30 flex items-center justify-center shrink-0">
        <span className="text-[9px] font-bold text-muted-foreground/70 tabular-nums">{pen.pen_code}</span>
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-[12px] font-semibold text-foreground/80">{pen.pen_code}</span>
        {pen.label && <span className="text-[11px] text-muted-foreground/50 ml-1.5">· {pen.label}</span>}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-[11px] text-muted-foreground/50 tabular-nums">{filledCount}/{measurements.length}</span>
        {lowest != null && (
          <span className="text-[11px] font-semibold text-primary/70 tabular-nums">{lowest.toFixed(2)} Ω</span>
        )}
      </div>
    </button>
  );
}

/** Expanded pen section with depth measurements */
function PenMeasurementSection({ pen, electrode, tenantId, recalcRa, depthsInitRef, initializeDepthRows }: {
  pen: any;
  electrode: any;
  tenantId: string;
  recalcRa: (electrodeId: string, measurements: any[]) => void;
  depthsInitRef: React.MutableRefObject<Set<string>>;
  initializeDepthRows: (penId: string, pen: any) => void;
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
    <div id={`pen-section-${pen.id}`} className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Pen header */}
      <div className="flex items-center gap-2.5 px-1 py-1">
        <ChevronDown className="h-3.5 w-3.5 text-primary/50 shrink-0" />
        <div className="w-7 h-7 rounded-md bg-primary/8 flex items-center justify-center shrink-0">
          <span className="text-[9px] font-bold text-primary tabular-nums">{pen.pen_code}</span>
        </div>
        <span className="text-[12px] font-semibold text-foreground">{pen.pen_code}</span>
        {pen.label && <span className="text-[11px] text-muted-foreground/50">· {pen.label}</span>}
      </div>

      <DepthMeasurementTable
        measurements={measurements}
        onAdd={handleAdd}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />
    </div>
  );
}
