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
    <div>
      <WizardStepHeader title="Elektrode" subtitle="Bevestig of pas de elektrodegegevens aan" />

      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <FieldGroup label="Code">
            <Input value={electrodeCode} onChange={e => setElectrodeCode(e.target.value)} className="h-11 text-[13px] font-mono" />
          </FieldGroup>
          <FieldGroup label="Label" optional>
            <Input value={electrodeLabel} onChange={e => setElectrodeLabel(e.target.value)} className="h-11 text-[13px]" placeholder="Optioneel" />
          </FieldGroup>
        </div>

        <FieldGroup label="Doelwaarde (Ω)" optional>
          <Input
            type="number"
            inputMode="decimal"
            step="0.01"
            value={targetValue}
            onChange={e => setTargetValue(e.target.value)}
            className="h-11 text-[13px]"
            placeholder="Bijv. 2.00"
          />
        </FieldGroup>

        <div className="flex items-center justify-between p-4 rounded-xl bg-muted/20 border border-border/50">
          <div>
            <p className="text-[13px] font-medium text-foreground">Gekoppeld</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Meerdere pennen aan dezelfde elektrode</p>
          </div>
          <Switch checked={isCoupled} onCheckedChange={setIsCoupled} />
        </div>

        <FieldGroup label="Notities" optional>
          <Textarea
            value={electrodeNotes}
            onChange={e => setElectrodeNotes(e.target.value)}
            className="text-[13px] min-h-[70px]"
            placeholder="Opmerkingen bij deze elektrode…"
          />
        </FieldGroup>
      </div>
    </div>
  );
}

function FieldGroup({ label, optional, children }: { label: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide">
        {label}
        {optional && <span className="font-normal normal-case tracking-normal ml-1.5 text-muted-foreground/50">(optioneel)</span>}
      </Label>
      {children}
    </div>
  );
}
