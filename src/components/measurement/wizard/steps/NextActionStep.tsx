import { WizardStepHeader } from '../WizardStepHeader';
import { Paperclip, Save } from 'lucide-react';
import { GroundingIcon } from '../../GroundingIcon';
import { cn } from '@/lib/utils';

interface NextActionStepProps {
  onAddElectrode: () => void;
  onGoToSketch: () => void;
  onSave: () => void;
  nextElectrodeNumber: number;
}

export function NextActionStep({ onAddElectrode, onGoToSketch, onSave, nextElectrodeNumber }: NextActionStepProps) {
  return (
    <div>
      <WizardStepHeader
        title="Volgende actie"
        subtitle="Kies hoe je verder wilt gaan"
      />

      <div className="space-y-2">
        <ActionCard
          icon={<GroundingIcon size={18} />}
          label={`Elektrode ${nextElectrodeNumber} starten`}
          description="Start een nieuwe elektrode met nieuwe pennen"
          onClick={onAddElectrode}
        />
        <ActionCard
          icon={<Paperclip className="h-[18px] w-[18px]" />}
          label="Schets en bijlagen"
          description="Upload schetsen, foto's en andere bestanden"
          onClick={onGoToSketch}
        />
        <ActionCard
          icon={<Save className="h-[18px] w-[18px]" />}
          label="Opslaan"
          description="Voortgang opslaan en afsluiten"
          onClick={onSave}
          muted
        />
      </div>
    </div>
  );
}

function ActionCard({ icon, label, description, onClick, muted }: {
  icon: React.ReactNode; label: string; description: string; onClick: () => void; muted?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-4 p-4 rounded-xl border transition-all duration-150',
        'active:scale-[0.995] text-left',
        muted
          ? 'border-border/40 bg-muted/10 hover:bg-muted/20 text-muted-foreground'
          : 'border-border/60 bg-card hover:bg-muted/15 hover:border-primary/25'
      )}
    >
      <div className={cn(
        'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
        muted ? 'bg-muted/30 text-muted-foreground/60' : 'bg-primary/6 text-primary'
      )}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className={cn('text-[13px] font-semibold', muted ? 'text-muted-foreground' : 'text-foreground')}>{label}</p>
        <p className="text-[11px] text-muted-foreground/60 mt-0.5 leading-relaxed">{description}</p>
      </div>
    </button>
  );
}
