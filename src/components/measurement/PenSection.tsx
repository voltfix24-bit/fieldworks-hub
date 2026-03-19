import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Pencil, Trash2, PenTool } from 'lucide-react';
import { useDepthMeasurements, useCreateDepthMeasurement, useUpdateDepthMeasurement, useDeleteDepthMeasurement } from '@/hooks/use-depth-measurements';
import { DepthMeasurementTable } from './DepthMeasurementTable';
import { PhotoUploader } from './PhotoUploader';
import { uploadMeasurementPhoto } from '@/hooks/use-attachments';
import { useAuth } from '@/contexts/AuthContext';
import { useUpdateElectrode } from '@/hooks/use-electrodes';

interface PenSectionProps {
  pen: any;
  electrode: any;
  onUpdate: (updates: any) => void;
  onDelete: () => void;
}

export function PenSection({ pen, electrode, onUpdate, onDelete }: PenSectionProps) {
  const { profile } = useAuth();
  const [isOpen, setIsOpen] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editCode, setEditCode] = useState(pen.pen_code);
  const [editLabel, setEditLabel] = useState(pen.label || '');
  const [editDepth, setEditDepth] = useState(String(pen.pen_depth_meters || ''));
  const [editNotes, setEditNotes] = useState(pen.notes || '');
  const [uploading, setUploading] = useState(false);

  const { data: measurements = [] } = useDepthMeasurements(pen.id);
  const createMeasurement = useCreateDepthMeasurement();
  const updateMeasurement = useUpdateDepthMeasurement();
  const deleteMeasurement = useDeleteDepthMeasurement();
  const updateElectrode = useUpdateElectrode();

  const handleSaveEdit = () => {
    onUpdate({ pen_code: editCode, label: editLabel || null, pen_depth_meters: editDepth ? parseFloat(editDepth) : null, notes: editNotes || null });
    setIsEditing(false);
  };

  const recalcRa = (updatedMeasurements: any[]) => {
    if (!electrode.is_coupled) {
      const lowestResistance = updatedMeasurements.length > 0 ? Math.min(...updatedMeasurements.map((m: any) => m.resistance_value)) : null;
      updateElectrode.mutate({ id: electrode.id, ra_value: lowestResistance });
    }
  };

  const handleAddMeasurement = (depth: number, resistance: number) => {
    createMeasurement.mutate({
      tenant_id: profile?.tenant_id, project_id: pen.project_id,
      measurement_session_id: pen.measurement_session_id, electrode_id: pen.electrode_id,
      pen_id: pen.id, depth_meters: depth, resistance_value: resistance, sort_order: measurements.length,
    }, { onSuccess: () => { recalcRa([...measurements, { resistance_value: resistance }]); } });
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
    <Card className="border-l-2 border-l-accent/30">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between px-3 py-2.5 cursor-pointer hover:bg-muted/20 transition-colors">
            <div className="flex items-center gap-2">
              {isOpen ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
              <PenTool className="h-3.5 w-3.5 text-accent" />
              <span className="text-sm font-medium">{pen.pen_code}{pen.label ? ` — ${pen.label}` : ''}</span>
              <span className="text-xs text-muted-foreground">({measurements.length} metingen)</span>
            </div>
            <div className="flex gap-1" onClick={e => e.stopPropagation()}>
              <Button size="sm" variant="ghost" onClick={() => setIsEditing(!isEditing)} className="h-6 w-6 p-0"><Pencil className="h-3 w-3" /></Button>
              <Button size="sm" variant="ghost" onClick={onDelete} className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"><Trash2 className="h-3 w-3" /></Button>
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="px-3 pb-3 pt-0 space-y-3">
            {isEditing && (
              <div className="p-2.5 bg-muted/20 rounded-md space-y-2 border border-border">
                <div className="grid grid-cols-2 gap-2">
                  <div><Label className="text-xs">Code</Label><Input value={editCode} onChange={e => setEditCode(e.target.value)} className="h-7 text-sm" /></div>
                  <div><Label className="text-xs">Label</Label><Input value={editLabel} onChange={e => setEditLabel(e.target.value)} className="h-7 text-sm" /></div>
                </div>
                <div><Label className="text-xs">Diepte (m)</Label><Input type="number" inputMode="decimal" value={editDepth} onChange={e => setEditDepth(e.target.value)} className="h-7 text-sm" /></div>
                <div><Label className="text-xs">Notities</Label><Textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} className="text-sm min-h-[50px]" /></div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveEdit} className="h-7 text-xs">Opslaan</Button>
                  <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)} className="h-7 text-xs">Annuleren</Button>
                </div>
              </div>
            )}

            <DepthMeasurementTable measurements={measurements} onAdd={handleAddMeasurement} onUpdate={handleUpdateMeasurement} onDelete={handleDeleteMeasurement} />

            <div className="grid grid-cols-2 gap-3">
              <PhotoUploader label="Detailfoto" currentUrl={pen.display_photo_url} onUpload={(file) => handlePhotoUpload('display_photo_url', file)} onRemove={() => onUpdate({ display_photo_url: null })} uploading={uploading} />
              <PhotoUploader label="Overzichtsfoto" currentUrl={pen.overview_photo_url} onUpload={(file) => handlePhotoUpload('overview_photo_url', file)} onRemove={() => onUpdate({ overview_photo_url: null })} uploading={uploading} />
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
