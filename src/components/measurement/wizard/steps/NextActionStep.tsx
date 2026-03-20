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
      <div className={compact ? 'mb-1.5' : 'mb-4'}>
        <h2 className={cn(
          'font-semibold text-foreground tracking-tight',
          compact ? 'text-[12px]' : 'text-[15px]'
        )}>
          Volgende actie
        </h2>
        <p className={cn(
          'text-muted-foreground/60 mt-0.5',
          compact ? 'text-[10px]' : 'text-[13px]'
        )}>
          Kies hoe je verder wilt gaan
        </p>
      </div>

      <div className={compact ? 'space-y-1' : 'space-y-2'}>
        <ActionCard
          icon={<GroundingIcon size={compact ? 14 : 18} />}
          label={`Elektrode ${nextElectrodeNumber} starten`}
          description="Nieuwe elektrode met nieuwe pennen"
          onClick={onAddElectrode}
          compact={compact}
          primary
        />
        <ActionCard
          icon={<Paperclip className={compact ? 'h-3.5 w-3.5' : 'h-[18px] w-[18px]'} />}
          label="Schets en bijlagen"
          description="Schetsen, foto's en bestanden"
          onClick={onGoToSketch}
          compact={compact}
        />
        <ActionCard
          icon={<Save className={compact ? 'h-3.5 w-3.5' : 'h-[18px] w-[18px]'} />}
          label="Opslaan"
          description="Voortgang opslaan en afsluiten"
          onClick={onSave}
          compact={compact}
          muted
        />
      </div>
    </div>
  );
}

function ActionCard({ icon, label, description, onClick, muted, compact, primary }: {
  icon: React.ReactNode; label: string; description: string; onClick: () => void; muted?: boolean; compact?: boolean; primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-2.5 rounded-lg border transition-all duration-150',
        'active:scale-[0.995] text-left',
        compact ? 'p-2.5' : 'p-4',
        muted
          ? 'border-border/20 bg-muted/5 hover:bg-muted/15 text-muted-foreground'
          : primary
            ? 'border-[hsl(var(--tenant-primary,var(--primary))/0.2)] bg-[hsl(var(--tenant-primary,var(--primary))/0.03)] hover:bg-[hsl(var(--tenant-primary,var(--primary))/0.06)]'
            : 'border-border/30 bg-card hover:bg-muted/15'
      )}
    >
      <div className={cn(
        'rounded-md flex items-center justify-center shrink-0',
        compact ? 'w-7 h-7' : 'w-10 h-10',
        muted
          ? 'bg-muted/30 text-muted-foreground/50'
          : primary
            ? 'bg-[hsl(var(--tenant-primary,var(--primary))/0.08)] text-[hsl(var(--tenant-primary,var(--primary)))]'
            : 'bg-muted/20 text-foreground/60'
      )}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className={cn(
          'font-semibold leading-snug',
          compact ? 'text-[11px]' : 'text-[13px]',
          muted ? 'text-muted-foreground' : 'text-foreground'
        )}>{label}</p>
        <p className={cn(
          'text-muted-foreground/45 leading-snug',
          compact ? 'text-[9px] mt-0' : 'text-[11px] mt-0.5'
        )}>{description}</p>
      </div>
    </button>
  );
}
