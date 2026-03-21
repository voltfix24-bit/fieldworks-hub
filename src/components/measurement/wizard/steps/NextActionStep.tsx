import { Paperclip, Save, PenTool } from 'lucide-react';
import { GroundingIcon } from '../../GroundingIcon';
import { cn } from '@/lib/utils';
import HandtekeningPad from '../../HandtekeningPad';
import { useHandtekening } from '@/hooks/useHandtekening';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface NextActionStepProps {
  onAddElectrode: () => void;
  onGoToSketch: () => void;
  onSave: () => void;
  nextElectrodeNumber: number;
  compact?: boolean;
  onHandtekeningChange?: (base64: string | null) => void;
}

export function NextActionStep({ onAddElectrode, onGoToSketch, onSave, nextElectrodeNumber, compact, onHandtekeningChange }: NextActionStepProps) {
  const { user } = useAuth();
  const { slaHandtekeningOp } = useHandtekening(user?.id);

  const handleHandtekeningChange = async (base64: string | null) => {
    onHandtekeningChange?.(base64);
    if (base64) {
      try {
        await slaHandtekeningOp(base64);
        toast({ title: 'Handtekening opgeslagen', description: 'Wordt automatisch gebruikt op de rapportpagina.' });
      } catch {
        // Silent fail — signature still works for current session
      }
    }
  };
  return (
    <div>
      <div className={compact ? 'mb-3' : 'mb-5'}>
        <h2 className={cn(
          'font-bold text-foreground tracking-tight',
          compact ? 'text-[16px]' : 'text-[17px]'
        )}>
          Volgende actie
        </h2>
        <p className={cn(
          'text-muted-foreground/50 mt-0.5',
          compact ? 'text-[12px]' : 'text-[13px]'
        )}>
          Kies hoe je verder wilt gaan
        </p>
      </div>

      <div className={compact ? 'space-y-2' : 'space-y-2.5'}>
        <ActionCard
          icon={<GroundingIcon size={compact ? 16 : 18} />}
          label={`Elektrode ${nextElectrodeNumber} starten`}
          description="Nieuwe elektrode met nieuwe pennen"
          onClick={onAddElectrode}
          compact={compact}
          primary
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
          compact={compact}
          muted
        />
      </div>

      {/* Handtekening sectie */}
      <div className={cn('mt-6', compact ? 'mt-5' : 'mt-8')}>
        <div className="flex items-center gap-2 mb-3">
          <PenTool className="h-4 w-4 text-muted-foreground/50" />
          <h3 className={cn(
            'font-semibold text-foreground tracking-tight',
            compact ? 'text-[14px]' : 'text-[15px]'
          )}>
            Handtekening monteur
          </h3>
        </div>
        <p className={cn(
          'text-muted-foreground/40 mb-3',
          compact ? 'text-[11px]' : 'text-[12px]'
        )}>
          Optioneel — wordt opgenomen in het rapport
        </p>
        <HandtekeningPad
          onChange={onHandtekeningChange}
          breedte={compact ? 400 : 500}
          hoogte={compact ? 140 : 180}
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
        'w-full flex items-center gap-3.5 rounded-2xl transition-all duration-150',
        'active:scale-[0.98] text-left',
        compact ? 'p-3.5' : 'p-4',
        muted
          ? 'bg-muted/20'
          : primary
            ? 'bg-[hsl(var(--tenant-primary)/0.04)]'
            : 'bg-card'
      )}
    >
      <div className={cn(
        'rounded-xl flex items-center justify-center shrink-0',
        compact ? 'w-9 h-9' : 'w-10 h-10',
        muted
          ? 'bg-muted/30 text-muted-foreground/40'
          : primary
            ? 'bg-[hsl(var(--tenant-primary)/0.1)] text-[hsl(var(--tenant-primary))]'
            : 'bg-muted/30 text-foreground/50'
      )}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className={cn(
          'font-semibold leading-snug',
          compact ? 'text-[14px]' : 'text-[15px]',
          muted ? 'text-muted-foreground/60' : primary ? 'text-foreground' : 'text-foreground'
        )}>{label}</p>
        <p className={cn(
          'text-muted-foreground/40 leading-snug',
          compact ? 'text-[11px] mt-0.5' : 'text-[12px] mt-0.5'
        )}>{description}</p>
      </div>
    </button>
  );
}
