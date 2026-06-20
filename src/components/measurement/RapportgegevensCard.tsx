import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, Save, AlertTriangle } from 'lucide-react';
import { useEquipment } from '@/hooks/use-equipment';
import { useUpdateMeasurementSession } from '@/hooks/use-measurement-sessions';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Props {
  projectId: string;
  session: any;
  equipmentId: string | null | undefined;
  compact?: boolean;
}

function formatDateNL(iso?: string | null): string {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return iso;
  return `${d}-${m}-${y}`;
}

export function RapportgegevensCard({ projectId, session, equipmentId, compact }: Props) {
  const qc = useQueryClient();
  const { data: equipment } = useEquipment(equipmentId || undefined);
  const updateSession = useUpdateMeasurementSession();

  const [date, setDate] = useState<string>(session?.measurement_date || '');
  const [notes, setNotes] = useState<string>(session?.measurement_notes || '');

  useEffect(() => {
    setDate(session?.measurement_date || '');
    setNotes(session?.measurement_notes || '');
  }, [session?.id, session?.measurement_date, session?.measurement_notes]);

  const dirty =
    (date || '') !== (session?.measurement_date || '') ||
    (notes || '') !== (session?.measurement_notes || '');

  const handleSave = async () => {
    if (!session?.id || !dirty) return;
    try {
      await updateSession.mutateAsync({
        id: session.id,
        measurement_date: date || null,
        measurement_notes: notes || null,
      });
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['measurement-session', projectId] }),
        qc.invalidateQueries({ queryKey: ['report-data', projectId] }),
        qc.invalidateQueries({ queryKey: ['projects', projectId] }),
      ]);
      toast({ title: 'Rapportgegevens opgeslagen' });
    } catch (e: any) {
      toast({ title: 'Opslaan mislukt', description: e?.message, variant: 'destructive' });
    }
  };

  // Calibration warning
  const next = equipment?.next_calibration_date;
  const expired = next ? new Date(next) < new Date() : false;

  return (
    <div className={cn(
      'rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-4 space-y-4',
      compact ? 'mt-3' : 'mt-4'
    )}>
      <div className="flex items-center justify-between">
        <h3 className="text-[13px] font-semibold tracking-tight text-foreground">Rapportgegevens</h3>
        {dirty && (
          <button
            onClick={handleSave}
            disabled={updateSession.isPending}
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-[hsl(var(--tenant-primary))] text-white disabled:opacity-50"
          >
            {updateSession.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
            Opslaan
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-muted-foreground">Meetdatum</span>
          <input
            type="date"
            value={date || ''}
            onChange={(e) => setDate(e.target.value)}
            className="h-9 px-3 rounded-lg border border-border bg-background text-[13px] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--tenant-primary)/0.3)]"
          />
        </label>

        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-muted-foreground">Apparatuur (actueel)</span>
          <div className="h-9 px-3 rounded-lg border border-dashed border-border bg-muted/30 text-[12px] flex items-center text-foreground/80 truncate">
            {equipment
              ? `${equipment.device_name || '—'}${equipment.serial_number ? ` · ${equipment.serial_number}` : ''}`
              : '— geen apparaat gekoppeld —'}
          </div>
        </div>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-[11px] font-medium text-muted-foreground">Opmerkingen voor rapport</span>
        <textarea
          value={notes || ''}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Optionele opmerkingen die in het rapport komen…"
          className="min-h-[72px] px-3 py-2 rounded-lg border border-border bg-background text-[13px] resize-y focus:outline-none focus:ring-2 focus:ring-[hsl(var(--tenant-primary)/0.3)]"
        />
      </label>

      {equipment && (
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/60">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Laatst gekalibreerd</span>
            <span className="text-[12px] font-medium text-foreground">{formatDateNL(equipment.calibration_date)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Volgende kalibratie</span>
            <span className={cn(
              'text-[12px] font-medium inline-flex items-center gap-1',
              expired ? 'text-destructive' : 'text-foreground'
            )}>
              {expired && <AlertTriangle className="h-3 w-3" />}
              {formatDateNL(equipment.next_calibration_date)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
