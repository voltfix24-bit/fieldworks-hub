import { useState, useEffect, useCallback, useRef } from 'react';
import { getDepthProgressionWarnings } from '../../DepthMeasurementTable';
import { DepthMeasurementTable } from '../../DepthMeasurementTable';
import { GroundingIcon } from '../../GroundingIcon';
import { Plus, ChevronDown, Trash2, Check, Camera, X as XIcon, Loader2, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MeasurementPhoto } from '@/components/ui/MeasurementPhoto';
import { useDepthMeasurements, useCreateDepthMeasurement, useUpdateDepthMeasurement, useDeleteDepthMeasurement } from '@/hooks/use-depth-measurements';
import { parsePositiveNlNumberOrNull, formatNlNumber, normaliseNlInput } from '@/lib/nl-number';
import { toast } from '@/hooks/use-toast';



interface PhotoControl {
  displayPhotoUrl: string | null;
  overviewPhotoUrl: string | null;
  uploading?: boolean;
  onUpload: (type: 'display_photo_url' | 'overview_photo_url', file: File) => void;
  onRemove: (type: 'display_photo_url' | 'overview_photo_url') => void;
}

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
  /** Controlled pen tab — single source of truth in parent workspace. */
  activePenId?: string | null;
  onActivePenChange?: (penId: string | null) => void;
  /** Optional inline photo tiles (mobile measurement card). */
  photoControl?: PhotoControl;
}

export function MeasurementStep({
  electrode, pens, tenantId,
  onUpdateElectrode, onAddPen, onDeletePen, recalcRa,
  depthsInitRef, initializeDepthRows, compact,
  onWarningCountChange, onRvMissingChange,
  activePenId: controlledActivePenId,
  onActivePenChange,
  photoControl,
}: MeasurementStepProps) {
  const showRv = pens.length > 1;
  const hasTarget = electrode.target_value != null;
  const targetMet = hasTarget && (
    showRv
      ? electrode.rv_value != null && electrode.rv_value <= electrode.target_value
      : electrode.ra_value != null && electrode.ra_value <= electrode.target_value
  );
  const rvMissing = showRv && (electrode.rv_value == null || electrode.rv_value === 0);

  // Local fallback when parent does not control the pen tab (desktop).
  const [uncontrolledPenId, setUncontrolledPenId] = useState<string | null>(null);
  const isControlled = controlledActivePenId !== undefined;
  const activePenId = isControlled ? controlledActivePenId : uncontrolledPenId;
  const setActivePenId = useCallback((id: string | null) => {
    if (isControlled) {
      onActivePenChange?.(id);
    } else {
      setUncontrolledPenId(id);
    }
  }, [isControlled, onActivePenChange]);

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

  // Track active pen — fallback to last pen if current id disappeared.
  // Only applied locally; controlled mode is owned by the parent.
  useEffect(() => {
    if (isControlled) return;
    if (pens.length === 0) { setUncontrolledPenId(null); return; }
    if (!uncontrolledPenId || !pens.find((p: any) => p.id === uncontrolledPenId)) {
      setUncontrolledPenId(pens[pens.length - 1].id);
    }
  }, [pens, uncontrolledPenId, isControlled]);

  const activePen = pens.find((p: any) => p.id === activePenId) || pens[0];


  // Sync RV input with electrode value
  useEffect(() => {
    setRvInput(electrode.rv_value != null ? String(electrode.rv_value).replace('.', ',') : '');
  }, [electrode.rv_value]);

  // Sync target input with electrode value
  useEffect(() => {
    setTargetInput(electrode.target_value != null ? String(electrode.target_value).replace('.', ',') : '');
  }, [electrode.target_value]);

  const handleRvBlur = () => {
    const parsed = parsePositiveNlNumberOrNull(rvInput);
    if (parsed !== electrode.rv_value) {
      onUpdateElectrode({ rv_value: parsed, ra_value: null, is_coupled: true });
    }
  };

  const handleTargetBlur = () => {
    const parsed = parsePositiveNlNumberOrNull(targetInput);
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
            onChange={e => setTargetInput(normaliseNlInput(e.target.value).replace('-', ''))}
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
          : !electrode.rv_value
            ? 'bg-card'
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
              : !electrode.rv_value
                ? 'text-muted-foreground/25'
                : hasTarget && !targetMet ? 'text-destructive' : 'text-[hsl(var(--status-completed))]'
          )}>
            {!showRv
              ? electrode.ra_value != null ? `${formatNlNumber(Number(electrode.ra_value))} Ω` : '— Ω'
              : !electrode.rv_value ? '— Ω' : `${formatNlNumber(Number(electrode.rv_value))} Ω`
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
      {/* ─── Pen tabs (horizontaal) ─── */}
      {pens.length > 0 && (
        <div className="flex items-stretch gap-0.5 overflow-x-auto -mx-4 px-4 border-b border-border/20">
          {pens.map((pen: any) => {
            const isActive = activePen?.id === pen.id;
            return (
              <button
                key={pen.id}
                onMouseDown={(e) => {
                  e.preventDefault();
                  (document.activeElement as HTMLElement)?.blur();
                  setTimeout(() => setActivePenId(pen.id), 30);
                }}
                className={cn(
                  'shrink-0 px-3.5 pt-2.5 pb-2 text-[13px] font-semibold whitespace-nowrap transition-colors',
                  'border-b-2 -mb-px',
                  isActive
                    ? 'border-[hsl(var(--tenant-primary,var(--primary)))] text-[hsl(var(--tenant-primary,var(--primary)))]'
                    : 'border-transparent text-muted-foreground/55 hover:text-foreground/80'
                )}
              >
                {pen.pen_code}
              </button>
            );
          })}
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              (document.activeElement as HTMLElement)?.blur();
              setTimeout(onAddPen, 50);
            }}
            className="shrink-0 flex items-center gap-1 px-3 pt-2.5 pb-2 text-[12px] font-bold text-[hsl(var(--tenant-primary,var(--primary))/0.75)] active:scale-[0.96] transition-transform"
          >
            <Plus className="h-3.5 w-3.5" />
            Pen
          </button>
        </div>
      )}

      {/* ─── Actieve pen: 'Diepte metingen' kaart (Zite-stijl) ─── */}
      {activePen && (
        <div className="rounded-3xl bg-card shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.08)] overflow-hidden">
          <div className="flex items-start justify-between px-5 pt-5 pb-3">
            <h3 className="text-[24px] font-extrabold text-foreground tracking-tight leading-tight">
              Diepte metingen
            </h3>
            {pens.length > 1 && onDeletePen && (
              <button
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (window.confirm(`${activePen.pen_code} verwijderen? Alle metingen van deze pen gaan verloren.`)) {
                    onDeletePen(activePen.id);
                  }
                }}
                className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium text-destructive/60 hover:bg-destructive/8 active:scale-95 transition-all"
                aria-label={`${activePen.pen_code} verwijderen`}
              >
                <Trash2 className="h-3 w-3" />
                Verwijderen
              </button>
            )}
          </div>
          <div className="px-3 pb-3">
            <PenMeasurementSection
              key={activePen.id}
              pen={activePen}
              electrode={electrode}
              tenantId={tenantId}
              recalcRa={recalcRa}
              depthsInitRef={depthsInitRef}
              initializeDepthRows={initializeDepthRows}
              onWarningCount={(count) => handlePenWarnings(activePen.id, count)}
              compact={compact}
            />
          </div>

          {/* Foto's — inline in dezelfde kaart */}
          {photoControl && (
            <div className="px-5 pt-3 pb-4 border-t border-border/15">
              <InlinePhotosSection compact={compact} {...photoControl} />
            </div>
          )}

          {/* Sticky primary CTA — pill style */}
          <div className="px-5 pb-5 pt-1">
            <button
              onMouseDown={(e) => {
                e.preventDefault();
                const actief = document.activeElement as HTMLElement;
                if (actief && (actief.tagName === 'INPUT' || actief.tagName === 'TEXTAREA')) {
                  actief.blur();
                }
                setTimeout(() => {
                  toast({ description: `${activePen.pen_code} opgeslagen ✓`, duration: 1500 });
                  if (navigator.vibrate) navigator.vibrate(8);
                }, 60);
              }}
              className={cn(
                'w-full inline-flex items-center justify-center gap-2',
                'h-14 rounded-full text-[16px] font-bold text-white',
                'bg-[hsl(var(--tenant-primary,var(--primary)))]',
                'shadow-[0_4px_14px_-4px_hsl(var(--tenant-primary,var(--primary))/0.55)]',
                'active:scale-[0.98] transition-transform'
              )}
            >
              <Save className="h-4 w-4" />
              Pen opslaan
            </button>
          </div>
        </div>
      )}


      {/* ─── RV-waarde (alleen bij meerdere pennen) ─── */}
      {showRv && (
        <div className={cn(
          'rounded-xl border border-border/30 bg-card overflow-hidden',
          compact ? 'p-3' : 'p-4',
        )}>
          <label className="text-[11px] uppercase tracking-widest font-bold text-muted-foreground/60 mb-1.5 block">
            RV-waarde (Ω) · handmatig
          </label>
          <div className="flex items-center gap-2">
            <GroundingIcon size={13} className="shrink-0 text-muted-foreground/60" />
            <input
              type="text"
              inputMode="decimal"
              value={rvInput}
              onChange={e => setRvInput(normaliseNlInput(e.target.value).replace('-', ''))}
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
          {!rvInput && (
            <p className="text-[11px] text-muted-foreground/40 mt-1.5">
              Vul in na de laatste pen — afgelezen van meetapparaat
            </p>
          )}
        </div>
      )}

      {/* ─── Foto's optioneel (inline mobiele meetkaart) ─── */}
      {photoControl && (
        <InlinePhotosSection compact={compact} {...photoControl} />
      )}



      {/* DEEL 6 — Notitie per elektrode */}
      <ElectrodeNoteSection
        notes={electrode.notes}
        onSave={(notes) => onUpdateElectrode({ notes })}
        compact={compact}
      />
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

/* ── Electrode note section ── */
function ElectrodeNoteSection({ notes, onSave, compact }: {
  notes: string | null;
  onSave: (notes: string | null) => void;
  compact?: boolean;
}) {
  const [notitie, setNotitie] = useState(notes || '');
  const [notitieOpen, setNotitieOpen] = useState(!!notes);

  return (
    <div className="mt-2">
      {!notitieOpen ? (
        <button
          onMouseDown={(e) => {
            e.preventDefault();
            setNotitieOpen(true);
          }}
          className={cn(
            'flex items-center gap-1.5 text-muted-foreground/40 active:text-muted-foreground/70 transition-colors',
            compact ? 'text-[11px]' : 'text-[12px]'
          )}
        >
          <Plus className="h-3 w-3" />
          Notitie toevoegen
        </button>
      ) : (
        <div className="rounded-xl border border-border/30 overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-border/20">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M11 4H4C3.45 4 3 4.45 3 5V19C3 19.55 3.45 20 4 20H18C18.55 20 19 19.55 19 19V12" stroke="hsl(var(--muted-foreground))" strokeWidth="2" strokeLinecap="round"/>
              <path d="M17.5 2.5L21.5 6.5L12 16L8 17L9 13L17.5 2.5Z" stroke="hsl(var(--muted-foreground))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className={cn('font-semibold text-muted-foreground/60', compact ? 'text-[11px]' : 'text-[12px]')}>
              Notitie
            </span>
            {notitie && (
              <span className="ml-auto text-[10px] text-muted-foreground/30">Opgeslagen</span>
            )}
          </div>
          <textarea
            value={notitie}
            onChange={(e) => setNotitie(e.target.value)}
            onBlur={() => {
              if (notitie !== (notes || '')) {
                onSave(notitie || null);
              }
            }}
            placeholder="Bijv. grond erg droog, kabel beschadigd..."
            autoFocus={!notes}
            rows={2}
            className={cn(
              'w-full bg-transparent resize-none outline-none px-3 py-2.5 text-foreground placeholder:text-muted-foreground/30',
              compact ? 'text-[12px]' : 'text-[13px]'
            )}
          />
        </div>
      )}
    </div>
  );
}

/* ── Inline mobile photo tiles (Display + Overzicht) ── */
function InlinePhotosSection({
  displayPhotoUrl, overviewPhotoUrl, uploading, onUpload, onRemove, compact,
}: PhotoControl & { compact?: boolean }) {
  return (
    <div className={cn('rounded-2xl border border-border/30 bg-card overflow-hidden', compact ? 'p-3' : 'p-4')}>
      <div className="flex items-baseline justify-between mb-2.5">
        <h3 className="text-[13px] font-bold text-foreground tracking-tight">Foto's</h3>
        <span className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/40">Optioneel</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <InlinePhotoTile
          label="Displayfoto"
          url={displayPhotoUrl}
          uploading={!!uploading}
          onPick={(f) => onUpload('display_photo_url', f)}
          onRemove={() => onRemove('display_photo_url')}
        />
        <InlinePhotoTile
          label="Overzichtsfoto"
          url={overviewPhotoUrl}
          uploading={!!uploading}
          onPick={(f) => onUpload('overview_photo_url', f)}
          onRemove={() => onRemove('overview_photo_url')}
        />
      </div>
    </div>
  );
}

function InlinePhotoTile({ label, url, uploading, onPick, onRemove }: {
  label: string;
  url: string | null;
  uploading: boolean;
  onPick: (file: File) => void;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (f) onPick(f);
  };

  if (url) {
    return (
      <div className="relative">
        <p className="text-[10px] font-medium text-muted-foreground/50 mb-1.5">{label}</p>
        <div className="relative rounded-xl overflow-hidden">
          <MeasurementPhoto src={url} alt={label} className="w-full aspect-[4/3] object-cover" />
          <button
            type="button"
            onClick={onRemove}
            disabled={uploading}
            className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center active:scale-90 transition-transform"
            aria-label={`${label} verwijderen`}
          >
            <XIcon className="h-3 w-3" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="text-[10px] font-medium text-muted-foreground/50 mb-1.5">{label}</p>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className={cn(
          'w-full aspect-[4/3] rounded-xl border border-dashed border-border/40 bg-muted/10',
          'flex flex-col items-center justify-center gap-1.5 text-muted-foreground/55',
          'active:scale-[0.98] transition-all',
          uploading && 'opacity-60'
        )}
      >
        {uploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Camera className="h-4 w-4 text-[hsl(var(--tenant-primary,var(--primary)))]" />
            <span className="text-[11px] font-semibold">Toevoegen</span>
          </>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}

