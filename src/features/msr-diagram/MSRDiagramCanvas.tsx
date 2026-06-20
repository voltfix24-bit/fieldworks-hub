import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DiagramCanvas } from './Canvas';
import { DiagramToolbar } from './Toolbar';
import { ZoomControls } from './ZoomControls';
import { renderDiagramToPng } from './export-png';
import { DEFAULT_DIAGRAM, type MSRDiagram, type DoorSide } from './types';

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

  // Load existing diagram
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('project_diagrams' as any)
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

  const addElectrode = () => {
    const n = diagram.electrodes.length + 1;
    const id = (globalThis.crypto?.randomUUID?.() ?? `e-${Date.now()}-${n}`);
    const c = diagram.cabinet;
    const angle = ((n - 1) * 60 * Math.PI) / 180;
    const r = 180;
    const x = Math.max(20, Math.min(diagram.canvasSize.w - 20, c.x + c.w / 2 + Math.cos(angle) * r));
    const y = Math.max(20, Math.min(diagram.canvasSize.h - 20, c.y + c.h / 2 + Math.sin(angle) * r));
    update((d) => ({ ...d, electrodes: [...d.electrodes, { id, label: `E${n}`, x, y }] }));
    setSelectedId(id);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // 1. Upsert row to get id
      let rowId = existing?.id;
      if (!rowId) {
        const { data: inserted, error: insErr } = await supabase
          .from('project_diagrams' as any)
          .insert({
            tenant_id: tenantId,
            project_id: projectId,
            measurement_session_id: measurementSessionId || null,
            diagram_json: diagram as any,
          })
          .select('id')
          .single();
        if (insErr || !inserted) throw insErr || new Error('Opslaan mislukt');
        rowId = (inserted as { id: string }).id;
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
      const { error: updErr } = await supabase
        .from('project_diagrams' as any)
        .update({
          diagram_json: diagram as any,
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
          onMoveElectrode={(id, x, y) =>
            update((d) => ({ ...d, electrodes: d.electrodes.map((e) => (e.id === id ? { ...e, x, y } : e)) }))
          }
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
        onAddElectrode={addElectrode}
        onRenameElectrode={(id, label) =>
          update((d) => ({ ...d, electrodes: d.electrodes.map((e) => (e.id === id ? { ...e, label } : e)) }))
        }
        onRemoveElectrode={(id) => {
          update((d) => ({ ...d, electrodes: d.electrodes.filter((e) => e.id !== id) }));
          if (selectedId === id) setSelectedId(null);
        }}
      />
    </div>
  );
}
