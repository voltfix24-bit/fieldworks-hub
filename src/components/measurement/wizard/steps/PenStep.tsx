import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { WizardStepHeader } from '../WizardStepHeader';

interface PenStepProps {
  penCode: string;
  setPenCode: (v: string) => void;
  penLabel: string;
  setPenLabel: (v: string) => void;
  penNotes: string;
  setPenNotes: (v: string) => void;
}

export function PenStep({
  penCode, setPenCode,
  penLabel, setPenLabel,
  penNotes, setPenNotes,
}: PenStepProps) {
  return (
    <div>
      <WizardStepHeader title="Pen" subtitle="Bevestig of pas de pengegevens aan" />

      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <FieldGroup label="Code">
            <Input value={penCode} onChange={e => setPenCode(e.target.value)} className="h-11 text-[13px] font-mono" />
          </FieldGroup>
          <FieldGroup label="Label" optional>
            <Input value={penLabel} onChange={e => setPenLabel(e.target.value)} className="h-11 text-[13px]" placeholder="Optioneel" />
          </FieldGroup>
        </div>

        <FieldGroup label="Notities" optional>
          <Textarea
            value={penNotes}
            onChange={e => setPenNotes(e.target.value)}
            className="text-[13px] min-h-[70px]"
            placeholder="Opmerkingen bij deze pen…"
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
