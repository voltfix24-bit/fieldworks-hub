import { useState, useEffect } from 'react';
import { usePens, useCreatePen, useUpdatePen, useDeletePen } from '@/hooks/use-pens';
import { ElectrodeSummaryPanel } from './ElectrodeSummaryPanel';
import { PenTabSwitcher } from './PenTabSwitcher';
import { PenSection } from './PenSection';
import { useAuth } from '@/contexts/AuthContext';

interface ElectrodeCardProps {
  electrode: any;
  onUpdate: (updates: any) => void;
  onDelete: () => void;
}

export function ElectrodeCard({ electrode, onUpdate, onDelete }: ElectrodeCardProps) {
  const { profile } = useAuth();
  const { data: pens = [] } = usePens(electrode.id);
  const createPen = useCreatePen();
  const updatePen = useUpdatePen();
  const deletePen = useDeletePen();

  const [activePenId, setActivePenId] = useState<string | null>(null);

  // Auto-select first pen
  useEffect(() => {
    if (pens.length > 0 && (!activePenId || !pens.find((p: any) => p.id === activePenId))) {
      setActivePenId(pens[0].id);
    }
  }, [pens, activePenId]);

  const activePen = pens.find((p: any) => p.id === activePenId);

  const handleAddPen = () => {
    createPen.mutate({
      tenant_id: profile?.tenant_id, project_id: electrode.project_id,
      measurement_session_id: electrode.measurement_session_id, electrode_id: electrode.id,
      pen_code: `P${pens.length + 1}`, sort_order: pens.length,
    }, {
      onSuccess: (data) => setActivePenId(data.id),
    });
  };

  return (
    <div className="space-y-4">
      {/* Electrode summary */}
      <ElectrodeSummaryPanel
        electrode={electrode}
        penCount={pens.length}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />

      {/* Pen tabs */}
      <PenTabSwitcher
        pens={pens}
        activeId={activePenId}
        onSelect={setActivePenId}
        onAdd={handleAddPen}
        addDisabled={createPen.isPending}
      />

      {/* Active pen content */}
      {activePen ? (
        <div className="rounded-xl border border-border bg-card p-4">
          <PenSection
            key={activePen.id}
            pen={activePen}
            electrode={electrode}
            onUpdate={(updates) => updatePen.mutate({ id: activePen.id, ...updates })}
            onDelete={() => {
              deletePen.mutate({ id: activePen.id, electrodeId: electrode.id });
              const remaining = pens.filter((p: any) => p.id !== activePen.id);
              setActivePenId(remaining.length > 0 ? remaining[0].id : null);
            }}
          />
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground">Nog geen pennen</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Voeg een pen toe om metingen te starten</p>
        </div>
      )}
    </div>
  );
}
