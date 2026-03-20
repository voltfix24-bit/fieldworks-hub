import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Zap, Settings2, Trash2, ChevronDown, ChevronUp, Target, CheckCircle2, AlertTriangle } from 'lucide-react';
import { parseNlNumberOrNull, formatNlNumber } from '@/lib/nl-number';

interface ElectrodeSummaryPanelProps {
  electrode: any;
  penCount: number;
  onUpdate: (updates: any) => void;
  onDelete: () => void;
}

export function ElectrodeSummaryPanel({ electrode, penCount, onUpdate, onDelete }: ElectrodeSummaryPanelProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [editCode, setEditCode] = useState(electrode.electrode_code);
  const [editLabel, setEditLabel] = useState(electrode.label || '');
  const [editCoupled, setEditCoupled] = useState(electrode.is_coupled);
  const [editTarget, setEditTarget] = useState(electrode.target_value != null ? String(electrode.target_value).replace('.', ',') : '');
  const [editNotes, setEditNotes] = useState(electrode.notes || '');
  const [rvInput, setRvInput] = useState(electrode.rv_value != null ? String(electrode.rv_value).replace('.', ',') : '');

  const showRv = penCount > 1;
  const hasTarget = electrode.target_value != null;

  const handleSave = () => {
    onUpdate({
      electrode_code: editCode,
      label: editLabel || null,
      is_coupled: editCoupled,
      target_value: parseNlNumberOrNull(editTarget),
      notes: editNotes || null,
    });
    setShowSettings(false);
  };

  const handleRvBlur = () => {
    const parsed = parseNlNumberOrNull(rvInput);
    if (parsed !== electrode.rv_value) {
      onUpdate({ rv_value: parsed });
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      {/* Top row: electrode identity + actions */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Zap className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground leading-tight">
              {electrode.electrode_code}
              {electrode.label && <span className="font-normal text-muted-foreground"> — {electrode.label}</span>}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-muted-foreground">{penCount} pen{penCount !== 1 ? 'nen' : ''}</span>
              {electrode.is_coupled && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">Gekoppeld</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => setShowSettings(!showSettings)} className="h-8 w-8 p-0">
            <Settings2 className="h-4 w-4 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete} className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <MiniStat label="RA-waarde" value={electrode.ra_value != null ? `${formatNlNumber(Number(electrode.ra_value))} Ω` : '—'} accent />
        {showRv && (
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">RV-waarde</span>
            <input
              type="text"
              inputMode="decimal"
              value={rvInput}
              onChange={e => setRvInput(e.target.value)}
              onBlur={handleRvBlur}
              placeholder="0,00 Ω"
              className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-semibold ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
            <span className="text-[10px] text-muted-foreground">In te vullen bij meerdere pennen</span>
          </div>
        )}
        {hasTarget && (
          <MiniStat label="Doelwaarde" value={`${formatNlNumber(Number(electrode.target_value))} Ω`} />
        )}
        {hasTarget && electrode.target_met != null && (
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Status</span>
            <div className={`flex items-center gap-1.5 text-sm font-medium ${electrode.target_met ? 'text-green-600' : 'text-orange-500'}`}>
              {electrode.target_met ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
              {electrode.target_met ? 'Behaald' : 'Niet behaald'}
            </div>
          </div>
        )}
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="p-3 rounded-lg bg-muted/30 border border-border space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Code</Label><Input value={editCode} onChange={e => setEditCode(e.target.value)} className="h-8 text-sm" /></div>
            <div><Label className="text-xs">Label</Label><Input value={editLabel} onChange={e => setEditLabel(e.target.value)} className="h-8 text-sm" placeholder="Optioneel" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Doelwaarde (Ω)</Label>
              <input
                type="text"
                inputMode="decimal"
                value={editTarget}
                onChange={e => setEditTarget(e.target.value)}
                className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="Bijv. 2,00"
              />
            </div>
            <div className="flex items-center gap-2 pt-5"><Switch checked={editCoupled} onCheckedChange={setEditCoupled} /><Label className="text-xs">Gekoppeld</Label></div>
          </div>
          <div><Label className="text-xs">Notities</Label><Textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} className="text-sm min-h-[60px]" /></div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave}>Opslaan</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowSettings(false)}>Annuleren</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="space-y-1">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{label}</span>
      <p className={`text-sm font-semibold ${accent ? 'text-accent' : 'text-foreground'}`}>{value}</p>
    </div>
  );
}
