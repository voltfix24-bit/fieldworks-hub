import { useRef } from 'react';
import { WizardStepHeader } from '../WizardStepHeader';
import { DepthMeasurementTable } from '../../DepthMeasurementTable';
import { Input } from '@/components/ui/input';
import { GroundingIcon } from '../../GroundingIcon';
import { Plus } from 'lucide-react';
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

  return (
    <div className="space-y-5">
      <WizardStepHeader
        title={`Metingen — ${electrode.electrode_code}`}
        subtitle={`${pens.length} ${pens.length === 1 ? 'pen' : 'pennen'} · Voer weerstandswaarden in per diepte`}
      />

      {/* ─── RA / RV insight block ─── */}
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-9 h-9 rounded-lg bg-primary/6 flex items-center justify-center shrink-0">
            <GroundingIcon size={16} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold block">RA-waarde</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className={cn(
                'text-lg font-bold tabular-nums leading-none',
                electrode.ra_value != null ? 'text-primary' : 'text-muted-foreground/30'
              )}>
                {electrode.ra_value != null ? `${Number(electrode.ra_value).toFixed(2)} Ω` : '—'}
              </span>
              {electrode.ra_value != null && (
                <span className="text-[11px] text-muted-foreground">laagst gemeten</span>
              )}
            </div>
          </div>
          {hasTarget && (
            <div className={cn(
              'text-right shrink-0 px-3 py-1.5 rounded-lg',
              targetMet ? 'bg-[hsl(var(--status-completed)/0.08)]' : 'bg-muted/30'
            )}>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-medium block">Doel</span>
              <span className={cn(
                'text-[13px] font-semibold tabular-nums',
                targetMet ? 'text-[hsl(var(--status-completed))]' : 'text-muted-foreground'
              )}>
                {Number(electrode.target_value).toFixed(2)} Ω
              </span>
            </div>
          )}
        </div>

        {showRv && (
          <div className="flex items-center gap-3 px-4 py-3 border-t border-border/40 bg-muted/10">
            <div className="w-9" />
            <div className="flex-1 space-y-1.5">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold block">RV-waarde</span>
              <Input
                type="number"
                inputMode="decimal"
                step="0.01"
                value={electrode.rv_value ?? ''}
                onChange={e => onUpdateElectrode({ rv_value: e.target.value ? parseFloat(e.target.value) : null })}
                placeholder="Ω"
                className="h-10 text-[13px] font-semibold max-w-[180px]"
              />
              <span className="text-[10px] text-muted-foreground/50">In te vullen bij gekoppelde pennen</span>
            </div>
          </div>
        )}
      </div>

      {/* ─── Per-pen measurement sections ─── */}
      {pens.map((pen: any) => (
        <PenMeasurementSection
          key={pen.id}
          pen={pen}
          electrode={electrode}
          tenantId={tenantId}
          recalcRa={recalcRa}
          depthsInitRef={depthsInitRef}
          initializeDepthRows={initializeDepthRows}
        />
      ))}

      {/* ─── Add pen action ─── */}
      <button
        onClick={onAddPen}
        className={cn(
          'w-full flex items-center justify-center gap-2.5 py-4 mt-2',
          'rounded-xl border border-dashed border-primary/30',
          'text-[13px] font-semibold text-primary',
          'hover:bg-primary/4 hover:border-primary/50',
          'transition-all duration-150 active:scale-[0.995]',
          'min-h-[52px]'
        )}
      >
        <Plus className="h-4 w-4" />
        Pen toevoegen
      </button>
    </div>
  );
}

/** Individual pen section with its own depth measurements */
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

  // Init depths for this pen if needed
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
    <div id={`pen-section-${pen.id}`} className="space-y-3">
      {/* Pen header */}
      <div className="flex items-center gap-2 px-1">
        <div className="w-6 h-6 rounded-md bg-muted/40 flex items-center justify-center">
          <span className="text-[10px] font-bold text-muted-foreground">{pen.pen_code}</span>
        </div>
        <span className="text-[12px] font-semibold text-foreground">{pen.pen_code}</span>
        {pen.label && <span className="text-[11px] text-muted-foreground">· {pen.label}</span>}
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
