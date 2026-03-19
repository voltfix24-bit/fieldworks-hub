import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Switch } from '@/components/ui/switch';
import { ChevronDown, ChevronRight, Plus, Pencil, Trash2, Zap } from 'lucide-react';
import { usePens, useCreatePen, useUpdatePen, useDeletePen } from '@/hooks/use-pens';
import { PenSection } from './PenSection';
import { useAuth } from '@/contexts/AuthContext';

interface ElectrodeCardProps {
  electrode: any;
  onUpdate: (updates: any) => void;
  onDelete: () => void;
}

export function ElectrodeCard({ electrode, onUpdate, onDelete }: ElectrodeCardProps) {
  const { profile } = useAuth();
  const [isOpen, setIsOpen] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editCode, setEditCode] = useState(electrode.electrode_code);
  const [editLabel, setEditLabel] = useState(electrode.label || '');
  const [editCoupled, setEditCoupled] = useState(electrode.is_coupled);
  const [editTarget, setEditTarget] = useState(String(electrode.target_value || ''));
  const [editRv, setEditRv] = useState(String(electrode.rv_value || ''));
  const [editNotes, setEditNotes] = useState(electrode.notes || '');

  const { data: pens = [] } = usePens(electrode.id);
  const createPen = useCreatePen();
  const updatePen = useUpdatePen();
  const deletePen = useDeletePen();

  const handleSaveEdit = () => {
    onUpdate({
      electrode_code: editCode,
      label: editLabel || null,
      is_coupled: editCoupled,
      target_value: editTarget ? parseFloat(editTarget) : null,
      rv_value: editRv ? parseFloat(editRv) : null,
      notes: editNotes || null,
    });
    setIsEditing(false);
  };

  const handleAddPen = () => {
    createPen.mutate({
      tenant_id: profile?.tenant_id,
      project_id: electrode.project_id,
      measurement_session_id: electrode.measurement_session_id,
      electrode_id: electrode.id,
      pen_code: `P${pens.length + 1}`,
      sort_order: pens.length,
    });
  };

  const showRvField = electrode.is_coupled && pens.length > 1;

  return (
    <Card className="border-l-4 border-l-primary/30">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors py-3 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                <Zap className="h-4 w-4 text-primary" />
                <div>
                  <CardTitle className="text-sm font-semibold">
                    {electrode.electrode_code}{electrode.label ? ` — ${electrode.label}` : ''}
                  </CardTitle>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-muted-foreground">{pens.length} pen{pens.length !== 1 ? 's' : ''}</span>
                    {electrode.ra_value != null && <span className="text-xs font-medium text-accent">RA: {Number(electrode.ra_value).toFixed(2)} Ω</span>}
                    {electrode.rv_value != null && <span className="text-xs font-medium text-secondary">RV: {Number(electrode.rv_value).toFixed(2)} Ω</span>}
                    {electrode.is_coupled && <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">Coupled</span>}
                    {electrode.target_met === true && <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-700 font-medium">Target met</span>}
                    {electrode.target_met === false && electrode.target_value != null && <span className="text-xs px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 font-medium">Below target</span>}
                  </div>
                </div>
              </div>
              <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                <Button size="sm" variant="ghost" onClick={() => setIsEditing(!isEditing)} className="h-7 w-7 p-0">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" variant="ghost" onClick={onDelete} className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="px-4 pb-4 pt-0 space-y-4">
            {/* Edit form */}
            {isEditing && (
              <div className="p-3 bg-muted/30 rounded-lg space-y-3 border border-border">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Code</Label>
                    <Input value={editCode} onChange={e => setEditCode(e.target.value)} className="h-8 text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs">Label</Label>
                    <Input value={editLabel} onChange={e => setEditLabel(e.target.value)} className="h-8 text-sm" placeholder="Optional" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Target (Ω)</Label>
                    <Input type="number" inputMode="decimal" value={editTarget} onChange={e => setEditTarget(e.target.value)} className="h-8 text-sm" placeholder="Optional" />
                  </div>
                  <div className="flex items-center gap-2 pt-5">
                    <Switch checked={editCoupled} onCheckedChange={setEditCoupled} />
                    <Label className="text-xs">Coupled</Label>
                  </div>
                </div>
                {editCoupled && (
                  <div>
                    <Label className="text-xs">RV value (Ω)</Label>
                    <Input type="number" inputMode="decimal" value={editRv} onChange={e => setEditRv(e.target.value)} className="h-8 text-sm" placeholder="Enter when pens are coupled" />
                  </div>
                )}
                <div>
                  <Label className="text-xs">Notes</Label>
                  <Textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} className="text-sm min-h-[60px]" />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveEdit}>Save</Button>
                  <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                </div>
              </div>
            )}

            {/* RV field if coupled and multiple pens */}
            {showRvField && !isEditing && (
              <div className="flex items-center gap-3 p-2 bg-secondary/5 rounded-md border border-secondary/20">
                <span className="text-xs text-secondary font-medium">RV (coupled pens):</span>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={electrode.rv_value || ''}
                  onChange={e => onUpdate({ rv_value: e.target.value ? parseFloat(e.target.value) : null })}
                  className="h-7 w-28 text-sm"
                  placeholder="Ω"
                />
              </div>
            )}

            {/* Pens list */}
            {pens.map((pen: any) => (
              <PenSection
                key={pen.id}
                pen={pen}
                electrode={electrode}
                onUpdate={(updates) => updatePen.mutate({ id: pen.id, ...updates })}
                onDelete={() => deletePen.mutate({ id: pen.id, electrodeId: electrode.id })}
              />
            ))}

            {/* Add pen button */}
            <Button variant="outline" size="sm" onClick={handleAddPen} disabled={createPen.isPending} className="w-full border-dashed">
              <Plus className="mr-2 h-3.5 w-3.5" /> Add Pen
            </Button>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
