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
    <div className="space-y-4">
      <WizardStepHeader title="Pen" subtitle="Bevestig of pas de pengegevens aan" />

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-sm font-medium">Code</Label>
            <Input value={penCode} onChange={e => setPenCode(e.target.value)} className="h-11 text-sm mt-1" />
          </div>
          <div>
            <Label className="text-sm font-medium">Label <span className="text-muted-foreground font-normal">(opt.)</span></Label>
            <Input value={penLabel} onChange={e => setPenLabel(e.target.value)} className="h-11 text-sm mt-1" placeholder="Optioneel" />
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium">Notities <span className="text-muted-foreground font-normal">(optioneel)</span></Label>
          <Textarea value={penNotes} onChange={e => setPenNotes(e.target.value)} className="text-sm min-h-[70px] mt-1" />
        </div>
      </div>
    </div>
  );
}
