import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { WizardStepHeader } from '../WizardStepHeader';

interface ElectrodeStepProps {
  electrodeCode: string;
  setElectrodeCode: (v: string) => void;
  electrodeLabel: string;
  setElectrodeLabel: (v: string) => void;
  isCoupled: boolean;
  setIsCoupled: (v: boolean) => void;
  targetValue: string;
  setTargetValue: (v: string) => void;
  electrodeNotes: string;
  setElectrodeNotes: (v: string) => void;
}

export function ElectrodeStep({
  electrodeCode, setElectrodeCode,
  electrodeLabel, setElectrodeLabel,
  isCoupled, setIsCoupled,
  targetValue, setTargetValue,
  electrodeNotes, setElectrodeNotes,
}: ElectrodeStepProps) {
  return (
    <div className="space-y-4">
      <WizardStepHeader title="Elektrode" subtitle="Bevestig of pas de elektrodegegevens aan" />

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-sm font-medium">Code</Label>
            <Input value={electrodeCode} onChange={e => setElectrodeCode(e.target.value)} className="h-11 text-sm mt-1" />
          </div>
          <div>
            <Label className="text-sm font-medium">Label <span className="text-muted-foreground font-normal">(opt.)</span></Label>
            <Input value={electrodeLabel} onChange={e => setElectrodeLabel(e.target.value)} className="h-11 text-sm mt-1" placeholder="Optioneel" />
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium">Doelwaarde (Ω) <span className="text-muted-foreground font-normal">(optioneel)</span></Label>
          <Input type="number" inputMode="decimal" step="0.01" value={targetValue} onChange={e => setTargetValue(e.target.value)} className="h-11 text-sm mt-1" placeholder="Bijv. 2.00" />
        </div>

        <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border">
          <div>
            <p className="text-sm font-medium">Gekoppeld</p>
            <p className="text-xs text-muted-foreground">Meerdere pennen aan dezelfde elektrode</p>
          </div>
          <Switch checked={isCoupled} onCheckedChange={setIsCoupled} />
        </div>

        <div>
          <Label className="text-sm font-medium">Notities <span className="text-muted-foreground font-normal">(optioneel)</span></Label>
          <Textarea value={electrodeNotes} onChange={e => setElectrodeNotes(e.target.value)} className="text-sm min-h-[70px] mt-1" />
        </div>
      </div>
    </div>
  );
}
