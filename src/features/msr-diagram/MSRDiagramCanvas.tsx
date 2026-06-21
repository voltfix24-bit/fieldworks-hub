import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Save, Loader2, X } from 'lucide-react';
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
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
    update((d) => ({ ...d, electrodes: [...d.electrodes, { id, label: `E${n}`, x, y, anchor }] }));
    setSelectedId(id);
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
    <div className="fixed inset-0 z-[1000] bg-background flex flex-col">
      {/* Top bar */}
      <div className="shrink-0 flex items-center justify-between px-3 py-2.5 border-b border-border/60 bg-card">
        <button
          onClick={() => (backTo ? navigate(backTo) : navigate(-1))}
          className="h-9 w-9 flex items-center justify-center rounded-lg hover:bg-muted/30 active:scale-95"
          aria-label="Terug"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-[14px] font-semibold">Situatieschets</h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="h-9 px-3 rounded-lg bg-[hsl(var(--tenant-primary,var(--primary)))] text-white text-[12px] font-semibold flex items-center gap-1.5 active:scale-[0.97] disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Opslaan
        </button>
      </div>

      {/* Canvas with zoom overlay */}
      <div className="relative flex-1 min-h-0">
        <DiagramCanvas
          diagram={diagram}
          zoom={zoom}
          onMoveCabinet={(x, y) => update((d) => ({ ...d, cabinet: { ...d.cabinet, x, y } }))}
          onMoveElectrode={(id, x, y) => updateElectrode(id, { x, y })}
          onEditDistance={editDistance}
          selectedElectrodeId={selectedId}
          onSelectElectrode={setSelectedId}
        />
        <div className="absolute top-3 right-3">
          <ZoomControls zoom={zoom} onZoom={setZoom} />
        </div>
      </div>

      {/* Toolbar */}
      <DiagramToolbar
        diagram={diagram}
        selectedElectrodeId={selectedId}
        onHousingNumberChange={(v) =>
          update((d) => ({ ...d, cabinet: { ...d.cabinet, housingNumber: v } }))
        }
        onDoorSideChange={(v: DoorSide) =>
          update((d) => ({ ...d, cabinet: { ...d.cabinet, doorSide: v } }))
        }
        onAddElectrode={() => setChoosingAnchor(true)}
        onRenameElectrode={(id, label) => updateElectrode(id, { label })}
        onUpdateElectrode={updateElectrode}
        onRemoveElectrode={(id) => {
          update((d) => ({ ...d, electrodes: d.electrodes.filter((e) => e.id !== id) }));
          if (selectedId === id) setSelectedId(null);
        }}
      />

      {choosingAnchor && (
        <div className="absolute inset-0 z-10 flex items-end bg-black/25 p-3">
          <div className="w-full rounded-2xl border border-border/60 bg-card p-4 shadow-xl">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-[14px] font-bold text-foreground">Vanaf welke hoek meten?</p>
                <p className="mt-0.5 text-[12px] text-muted-foreground">Kies de referentiehoek van het object.</p>
              </div>
              <button
                type="button"
                onClick={() => setChoosingAnchor(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/40"
                aria-label="Sluiten"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {anchorOptions.map((anchor) => (
                <button
                  key={anchor.value}
                  type="button"
                  onClick={() => addElectrode(anchor.value)}
                  className="rounded-xl border border-border/60 bg-background px-3 py-4 text-left active:scale-[0.98]"
                >
                  <span className="block text-[11px] font-extrabold uppercase tracking-[0.16em] text-[hsl(var(--tenant-primary,var(--primary)))]">{anchor.hint}</span>
                  <span className="mt-1 block text-[14px] font-semibold text-foreground">{anchor.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getAnchorPoint(cabinet: MSRDiagram['cabinet'], anchor: MSRAnchor) {
  if (anchor === 'tl') return { x: cabinet.x, y: cabinet.y };
  if (anchor === 'tr') return { x: cabinet.x + cabinet.w, y: cabinet.y };
  if (anchor === 'bl') return { x: cabinet.x, y: cabinet.y + cabinet.h };
  return { x: cabinet.x + cabinet.w, y: cabinet.y + cabinet.h };
}
