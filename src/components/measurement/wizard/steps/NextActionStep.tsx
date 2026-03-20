import { Paperclip, Save } from 'lucide-react';
import { GroundingIcon } from '../../GroundingIcon';
import { cn } from '@/lib/utils';

interface NextActionStepProps {
  onAddElectrode: () => void;
  onGoToSketch: () => void;
  onSave: () => void;
  nextElectrodeNumber: number;
  compact?: boolean;
}

export function NextActionStep({ onAddElectrode, onGoToSketch, onSave, nextElectrodeNumber, compact }: NextActionStepProps) {
  return (
    <div>
      <div className={compact ? 'mb-2' : 'mb-4'}>
        <h2 className={`font-semibold text-foreground tracking-tight ${compact ? 'text-[13px]' : 'text-[15px]'}`}>
          Volgende actie
        </h2>
        <p className={`text-muted-foreground mt-0.5 ${compact ? 'text-[11px]' : 'text-[13px]'}`}>
          Kies hoe je verder wilt gaan
        </p>
      </div>

      <div className={compact ? 'space-y-1.5' : 'space-y-2'}>
        <ActionCard
          icon={<GroundingIcon size={compact ? 16 : 18} />}
          label={`Elektrode ${nextElectrodeNumber} starten`}
          description="Nieuwe elektrode met nieuwe pennen"
          onClick={onAddElectrode}
          compact={compact}
        />
        <ActionCard
          icon={<Paperclip className={compact ? 'h-4 w-4' : 'h-[18px] w-[18px]'} />}
          label="Schets en bijlagen"
          description="Schetsen, foto's en bestanden"
          onClick={onGoToSketch}
          compact={compact}
        />
        <ActionCard
          icon={<Save className={compact ? 'h-4 w-4' : 'h-[18px] w-[18px]'} />}
          label="Opslaan"
          description="Voortgang opslaan en afsluiten"
          onClick={onSave}
          muted
          compact={compact}
        />
      </div>
    </div>
  );
}

function ActionCard({ icon, label, description, onClick, muted, compact }: {
  icon: React.ReactNode; label: string; description: string; onClick: () => void; muted?: boolean; compact?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 rounded-xl border transition-all duration-150',
        'active:scale-[0.995] text-left',
        compact ? 'p-3' : 'p-4',
        muted
          ? 'border-border/30 bg-muted/5 hover:bg-muted/15 text-muted-foreground'
          : 'border-border/50 bg-card hover:bg-muted/15 hover:border-primary/25'
      )}
    >
      <div className={cn(
        'rounded-lg flex items-center justify-center shrink-0',
        compact ? 'w-8 h-8' : 'w-10 h-10',
        muted ? 'bg-muted/30 text-muted-foreground/60' : 'bg-primary/6 text-primary'
      )}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className={cn('font-semibold', compact ? 'text-[12px]' : 'text-[13px]', muted ? 'text-muted-foreground' : 'text-foreground')}>{label}</p>
        <p className={cn('text-muted-foreground/55 mt-0.5 leading-snug', compact ? 'text-[10px]' : 'text-[11px]')}>{description}</p>
      </div>
    </button>
  );
}
