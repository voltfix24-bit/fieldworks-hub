import { useState, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Settings2, Trash2 } from 'lucide-react';
import { useDepthMeasurements, useCreateDepthMeasurement, useUpdateDepthMeasurement, useDeleteDepthMeasurement } from '@/hooks/use-depth-measurements';
import { DepthMeasurementTable } from './DepthMeasurementTable';
import { PhotoUploader } from './PhotoUploader';
import { uploadMeasurementPhoto } from '@/hooks/use-attachments';
import { useAuth } from '@/contexts/AuthContext';
import { useUpdateElectrode } from '@/hooks/use-electrodes';
import { parseNlNumberOrNull } from '@/lib/nl-number';

interface PenSectionProps {
  pen: any;
  electrode: any;
  onUpdate: (updates: any) => void;
  onDelete: () => void;
}

export function PenSection({ pen, electrode, onUpdate, onDelete }: PenSectionProps) {
  const { profile } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [editCode, setEditCode] = useState(pen.pen_code);
  const [editLabel, setEditLabel] = useState(pen.label || '');
  const [editDepth, setEditDepth] = useState(pen.pen_depth_meters != null ? String(pen.pen_depth_meters).replace('.', ',') : '');
  const [editNotes, setEditNotes] = useState(pen.notes || '');
  const [uploading, setUploading] = useState(false);

  const { data: measurements = [] } = useDepthMeasurements(pen.id);
  const createMeasurement = useCreateDepthMeasurement();
  const updateMeasurement = useUpdateDepthMeasurement();
  const deleteMeasurement = useDeleteDepthMeasurement();
  const updateElectrode = useUpdateElectrode();

  const handleSaveEdit = () => {
    onUpdate({
      pen_code: editCode,
      label: editLabel || null,
      pen_depth_meters: parseNlNumberOrNull(editDepth),
      notes: editNotes || null,
    });
    setShowSettings(false);
  };

  const recalcRa = useCallback((updatedMeasurements: any[]) => {
    const validValues = updatedMeasurements.filter((m: any) => m.resistance_value > 0).map((m: any) => m.resistance_value);
    const lowestResistance = validValues.length > 0 ? Math.min(...validValues) : null;
    updateElectrode.mutate({ id: electrode.id, ra_value: lowestResistance });
  }, [electrode.id, updateElectrode]);

  const handleAddMeasurement = (depth: number, resistance: number) => {
    createMeasurement.mutate({
      tenant_id: profile?.tenant_id, project_id: pen.project_id,
      measurement_session_id: pen.measurement_session_id, electrode_id: pen.electrode_id,
      pen_id: pen.id, depth_meters: depth, resistance_value: resistance, sort_order: measurements.length,
    }, { onSuccess: () => { if (resistance > 0) recalcRa([...measurements, { resistance_value: resistance }]); } });
  };

  const handleUpdateMeasurement = (id: string, depth: number, resistance: number) => {
    updateMeasurement.mutate({ id, depth_meters: depth, resistance_value: resistance }, {
      onSuccess: () => { recalcRa(measurements.map((m: any) => m.id === id ? { ...m, resistance_value: resistance } : m)); }
    });
  };

  const handleDeleteMeasurement = (id: string) => {
    deleteMeasurement.mutate({ id, penId: pen.id }, {
      onSuccess: () => { recalcRa(measurements.filter((m: any) => m.id !== id)); }
    });
  };

  const handlePhotoUpload = async (type: 'display_photo_url' | 'overview_photo_url', file: File) => {
    setUploading(true);
    try {
      const url = await uploadMeasurementPhoto(file, profile?.tenant_id || '', pen.project_id);
      onUpdate({ [type]: url });
    } finally { setUploading(false); }
  };

  return (
    <div className="space-y-4">
      {/* Pen header bar */}
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Metingen — {pen.pen_code}{pen.label ? ` · ${pen.label}` : ''}
        </h4>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => setShowSettings(!showSettings)} className="h-7 w-7 p-0">
            <Settings2 className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete} className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Settings */}
      {showSettings && (
        <div className="p-3 rounded-lg bg-muted/30 border border-border space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div><Label className="text-xs">Code</Label><Input value={editCode} onChange={e => setEditCode(e.target.value)} className="h-8 text-sm" /></div>
            <div><Label className="text-xs">Label</Label><Input value={editLabel} onChange={e => setEditLabel(e.target.value)} className="h-8 text-sm" /></div>
          </div>
          <div>
            <Label className="text-xs">Pendiepte (m)</Label>
            <input
              type="text"
              inputMode="decimal"
              value={editDepth}
              onChange={e => setEditDepth(e.target.value)}
              className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="Bijv. 1,50"
            />
          </div>
          <div><Label className="text-xs">Notities</Label><Textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} className="text-sm min-h-[50px]" /></div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSaveEdit} className="h-7 text-xs">Opslaan</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowSettings(false)} className="h-7 text-xs">Annuleren</Button>
          </div>
        </div>
      )}

      {/* Depth measurements */}
      <DepthMeasurementTable
        measurements={measurements}
        onAdd={handleAddMeasurement}
        onUpdate={handleUpdateMeasurement}
        onDelete={handleDeleteMeasurement}
      />

      {/* Photos */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <PhotoUploader label="Detailfoto" currentUrl={pen.display_photo_url} onUpload={(file) => handlePhotoUpload('display_photo_url', file)} onRemove={() => onUpdate({ display_photo_url: null })} uploading={uploading} />
        <PhotoUploader label="Overzichtsfoto" currentUrl={pen.overview_photo_url} onUpload={(file) => handlePhotoUpload('overview_photo_url', file)} onRemove={() => onUpdate({ overview_photo_url: null })} uploading={uploading} />
      </div>
    </div>
  );
}
