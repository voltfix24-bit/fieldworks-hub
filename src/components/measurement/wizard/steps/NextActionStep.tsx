import { Button } from '@/components/ui/button';
import { WizardStepHeader } from '../WizardStepHeader';
import { Plus, Layers, Paperclip, Save } from 'lucide-react';
import { GroundingIcon } from '../../GroundingIcon';

interface NextActionStepProps {
  onAddPen: () => void;
  onAddElectrode: () => void;
  onGoToSketch: () => void;
  onSaveAndExit: () => void;
}

export function NextActionStep({ onAddPen, onAddElectrode, onGoToSketch, onSaveAndExit }: NextActionStepProps) {
  return (
    <div className="space-y-4">
      <WizardStepHeader
        title="Volgende actie"
        subtitle="Kies hoe je verder wilt gaan"
      />

      <div className="space-y-2.5">
        <ActionButton
          icon={<Plus className="h-5 w-5" />}
          label="Pen toevoegen"
          description="Voeg een extra pen toe aan deze elektrode"
          onClick={onAddPen}
        />
        <ActionButton
          icon={<GroundingIcon size={20} />}
          label="Elektrode toevoegen"
          description="Start een nieuwe elektrode met nieuwe pennen"
          onClick={onAddElectrode}
        />
        <ActionButton
          icon={<Paperclip className="h-5 w-5" />}
          label="Schets en bijlagen"
          description="Upload schetsen, foto's en andere bestanden"
          onClick={onGoToSketch}
        />
        <ActionButton
          icon={<Save className="h-5 w-5" />}
          label="Opslaan en later doorgaan"
          description="Alle voortgang is opgeslagen, je kunt later terugkomen"
          onClick={onSaveAndExit}
          subtle
        />
      </div>
    </div>
  );
}

function ActionButton({ icon, label, description, onClick, subtle }: {
  icon: React.ReactNode; label: string; description: string; onClick: () => void; subtle?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3.5 p-4 rounded-xl border transition-all active:scale-[0.99] text-left ${
        subtle
          ? 'border-border bg-muted/20 hover:bg-muted/40 text-muted-foreground'
          : 'border-border bg-card hover:bg-muted/30 hover:border-primary/30'
      }`}
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
        subtle ? 'bg-muted/50 text-muted-foreground' : 'bg-primary/10 text-primary'
      }`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </button>
  );
}
