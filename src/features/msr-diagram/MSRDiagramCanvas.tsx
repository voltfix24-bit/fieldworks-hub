import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, ImageIcon, Loader2, Plus, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DiagramCanvas } from './Canvas';
import { DiagramToolbar } from './Toolbar';
import { ZoomControls } from './ZoomControls';
import { renderDiagramToPng } from './export-png';
import { DEFAULT_DIAGRAM, type DiagramElectrode, type DoorSide, type MSRAnchor, type MSRDiagram } from './types';

interface Props {
  projectId: string;
  tenantId: string;
  measurementSessionId?: string | null;
  initialHousingNumber?: string | null;
  backTo?: string;
}

interface ExistingRow {
  id: string;
  diagram_json: MSRDiagram;
  image_path: string | null;
}

const anchorOptions: Array<{ value: MSRAnchor; label: string; hint: string }> = [
  { value: 'tl', label: 'Linksboven', hint: 'LB' },
  { value: 'tr', label: 'Rechtsboven', hint: 'RB' },
  { value: 'bl', label: 'Linksonder', hint: 'LO' },
  { value: 'br', label: 'Rechtsonder', hint: 'RO' },
];

export function MSRDiagramCanvas({
  projectId,
  tenantId,
  measurementSessionId,
  initialHousingNumber,
  backTo,
}: Props) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [diagram, setDiagram] = useState<MSRDiagram>(() => ({
    ...DEFAULT_DIAGRAM,
    cabinet: { ...DEFAULT_DIAGRAM.cabinet, housingNumber: initialHousingNumber || '' },
    electrodes: [],
  }));
  const [existing, setExisting] = useState<ExistingRow | null>(null);
  const [selection, setSelection] = useState<import('./Toolbar').Selection>(null);
  const selectedId = selection?.kind === 'electrode' ? selection.id : null;
  const cabinetSelected = selection?.kind === 'cabinet';
  const [zoom, setZoom] = useState(0.7);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [choosingAnchor, setChoosingAnchor] = useState(false);

  // Load existing diagram
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from('project_diagrams')
        .select('id, diagram_json, image_path')
        .eq('project_id', projectId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (cancelled) return;
      if (!error && data) {
        const row = data as unknown as ExistingRow;
        setExisting(row);
        if (row.diagram_json) setDiagram(row.diagram_json);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const update = useCallback((patch: (d: MSRDiagram) => MSRDiagram) => {
    setDiagram((d) => patch(d));
  }, []);

  const addElectrode = (anchor: MSRAnchor) => {
    const n = diagram.electrodes.length + 1;
    const id = (globalThis.crypto?.randomUUID?.() ?? `e-${Date.now()}-${n}`);
    const c = diagram.cabinet;
    const anchorPoint = getAnchorPoint(c, anchor);
    const offsetX = anchor === 'tl' || anchor === 'bl' ? -170 : 170;
    const offsetY = anchor === 'tl' || anchor === 'tr' ? -150 : 150;
    const x = Math.max(20, Math.min(diagram.canvasSize.w - 20, anchorPoint.x + offsetX));
    const y = Math.max(20, Math.min(diagram.canvasSize.h - 20, anchorPoint.y + offsetY));
    update((d) => ({ ...d, electrodes: [...d.electrodes, { id, label: `Elektrode ${n}`, x, y, anchor }] }));
    setSelection({ kind: 'electrode', id });
    setChoosingAnchor(false);
  };

  const updateElectrode = (id: string, patch: Partial<DiagramElectrode>) => {
    update((d) => ({
      ...d,
      electrodes: d.electrodes.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    }));
  };

  const editDistance = (id: string, axis: 'x' | 'y', currentValue: number) => {
    const label = axis === 'x' ? 'Horizontale afstand (m)' : 'Verticale afstand (m)';
    const input = window.prompt(label, currentValue.toFixed(2).replace('.', ','));
    if (input == null) return;
    const normalized = input.trim().replace(',', '.');
    if (normalized === '') {
      updateElectrode(id, axis === 'x' ? { overrideDistanceX: null } : { overrideDistanceY: null });
      return;
    }
    const next = Number(normalized);
    if (!Number.isFinite(next) || next < 0) {
      toast({ title: 'Ongeldige afstand', description: 'Gebruik een positief getal in meters.', variant: 'destructive' });
      return;
    }
    updateElectrode(id, axis === 'x' ? { overrideDistanceX: next } : { overrideDistanceY: next });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // 1. Upsert row to get id
      let rowId = existing?.id;
      if (!rowId) {
        const ins = await (supabase as any)
          .from('project_diagrams')
          .insert({
            tenant_id: tenantId,
            project_id: projectId,
            measurement_session_id: measurementSessionId || null,
            diagram_json: diagram,
          })
          .select('id')
          .single();
        if (ins.error || !ins.data) throw ins.error || new Error('Opslaan mislukt');
        rowId = (ins.data as { id: string }).id;
      }

      // 2. Render PNG
      const blob = await renderDiagramToPng(diagram);

      // 3. Upload to storage
      const path = `${tenantId}/${projectId}/diagram/${rowId}.png`;
      const { error: upErr } = await supabase.storage
        .from('project-files')
        .upload(path, blob, { upsert: true, contentType: 'image/png' });
      if (upErr) throw upErr;

      // 4. Update row with json + image_path
      const { error: updErr } = await (supabase as any)
        .from('project_diagrams')
        .update({
          diagram_json: diagram,
          image_path: path,
          measurement_session_id: measurementSessionId || null,
        })
        .eq('id', rowId);
      if (updErr) throw updErr;

      toast({ title: 'Situatieschets opgeslagen' });
      if (backTo) navigate(backTo);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Onbekende fout';
      toast({ title: 'Opslaan mislukt', description: msg, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[1000] bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[1000] bg-white">
      {/* Full-screen canvas */}
      <div className="absolute inset-0">
        <DiagramCanvas
          diagram={diagram}
          zoom={zoom}
          onMoveCabinet={(x, y) => update((d) => ({ ...d, cabinet: { ...d.cabinet, x, y } }))}
          onMoveElectrode={(id, x, y) => updateElectrode(id, { x, y })}
          onEditDistance={editDistance}
          selectedElectrodeId={selectedId}
          cabinetSelected={cabinetSelected}
          onSelectElectrode={(id) => setSelection(id ? { kind: 'electrode', id } : null)}
          onSelectCabinet={() => setSelection({ kind: 'cabinet' })}
        />
      </div>

      {/* Floating top bar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 px-2 pt-[max(10px,env(safe-area-inset-top))]">
        <div className="pointer-events-auto flex items-center gap-1.5 rounded-2xl bg-white/95 backdrop-blur px-2 py-2 shadow-lg ring-1 ring-border/50 min-w-0 max-w-full">
          <button
            onClick={() => (backTo ? navigate(backTo) : navigate(-1))}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-foreground active:scale-95"
            aria-label="Terug"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-[15px] font-extrabold tracking-tight text-foreground truncate min-w-0 flex-1">Schets</h1>
          <div className="ml-auto flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setChoosingAnchor(true)}
              aria-label="Elektrode toevoegen"
              className="flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-2.5 sm:px-3 text-[13px] font-bold text-white shadow-sm active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden xs:inline sm:inline">Toevoegen</span>
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              aria-label="Schets opslaan"
              className="flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-2.5 sm:px-3 text-[13px] font-bold text-white shadow-sm active:scale-[0.98] disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
              <span className="hidden xs:inline sm:inline">Opslaan</span>
            </button>
          </div>
        </div>
      </div>


      {/* Zoom controls */}
      <div className="absolute bottom-[max(20px,env(safe-area-inset-bottom))] right-4 z-20">
        <ZoomControls zoom={zoom} onZoom={setZoom} />
      </div>

      {/* Anchor picker overlay */}
      {choosingAnchor && (
        <div className="absolute left-1/2 top-[max(80px,calc(env(safe-area-inset-top)+72px))] z-30 w-[min(320px,calc(100%-24px))] -translate-x-1/2">
          <div className="rounded-2xl bg-emerald-600 p-3 text-white shadow-xl">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-[16px] font-extrabold leading-tight">Selecteer een referentiepunt</p>
              <button
                type="button"
                onClick={() => setChoosingAnchor(false)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-foreground"
                aria-label="Sluiten"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {anchorOptions.map((anchor) => (
                <button
                  key={anchor.value}
                  type="button"
                  onClick={() => addElectrode(anchor.value)}
                  className="rounded-xl bg-white/15 px-3 py-3 text-left active:scale-[0.98]"
                >
                  <span className="block text-[11px] font-extrabold uppercase tracking-[0.14em] text-white/70">{anchor.hint}</span>
                  <span className="mt-0.5 block text-[13px] font-bold text-white">{anchor.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Floating detail panel — only when something is selected */}
      <DiagramToolbar
        diagram={diagram}
        selection={selection}
        onClose={() => setSelection(null)}
        onHousingNumberChange={(v) =>
          update((d) => ({ ...d, cabinet: { ...d.cabinet, housingNumber: v } }))
        }
        onDoorSideChange={(v: DoorSide) =>
          update((d) => ({ ...d, cabinet: { ...d.cabinet, doorSide: v } }))
        }
        onRenameElectrode={(id, label) => updateElectrode(id, { label })}
        onUpdateElectrode={updateElectrode}
        onRemoveElectrode={(id) => {
          update((d) => ({ ...d, electrodes: d.electrodes.filter((e) => e.id !== id) }));
          if (selectedId === id) setSelection(null);
        }}
      />
    </div>
  );
}

function getAnchorPoint(cabinet: MSRDiagram['cabinet'], anchor: MSRAnchor) {
  if (anchor === 'tl') return { x: cabinet.x, y: cabinet.y };
  if (anchor === 'tr') return { x: cabinet.x + cabinet.w, y: cabinet.y };
  if (anchor === 'bl') return { x: cabinet.x, y: cabinet.y + cabinet.h };
  return { x: cabinet.x + cabinet.w, y: cabinet.y + cabinet.h };
}
