import { useState } from 'react';
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
  const [opslaanBevestiging, setOpslaanBevestiging] = useState(false);

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

        {/* Visuele scheiding */}
        <div className="flex items-center gap-3 py-1">
          <div className="flex-1 border-t border-border/20" />
          <span className="text-[10px] text-muted-foreground/30 font-medium">of</span>
          <div className="flex-1 border-t border-border/20" />
        </div>

        <ActionCard
          icon={<Save className={compact ? 'h-4 w-4' : 'h-[18px] w-[18px]'} />}
          label="Opslaan"
          description="Voortgang opslaan en afsluiten"
          onClick={() => setOpslaanBevestiging(true)}
          compact={compact}
          saveStyle
        />
      </div>

      {/* Handtekening sectie */}
      <div className="mt-4">
        <div className="flex items-center gap-2 mb-2">
          <PenTool className="h-3.5 w-3.5 text-muted-foreground/40" />
          <h3 className="text-[13px] font-semibold text-foreground">
            Handtekening monteur
          </h3>
          <span className="text-[11px] text-muted-foreground/30 ml-auto">
            Optioneel
          </span>
        </div>
        <HandtekeningPad
          onChange={handleHandtekeningChange}
          breedte={compact ? 400 : 500}
          hoogte={compact ? 140 : 180}
          monteurId={user?.id}
        />
      </div>

      {/* DEEL 4 — Save confirmation dialog */}
      {opslaanBevestiging && (
        <div className="fixed inset-0 z-[500] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-sm bg-background rounded-3xl p-5 shadow-xl">
            <h3 className="text-[17px] font-bold text-foreground mb-1">Meting afsluiten?</h3>
            <p className="text-[14px] text-muted-foreground/60 mb-5">
              De voortgang wordt opgeslagen. Je kunt later verder gaan via de project detail pagina.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => { setOpslaanBevestiging(false); onSave(); }}
                className="w-full py-3.5 rounded-2xl bg-[hsl(var(--tenant-primary))] text-white font-semibold text-[15px] active:scale-[0.98] transition-all"
              >
                Opslaan en afsluiten
              </button>
              <button
                onClick={() => setOpslaanBevestiging(false)}
                className="w-full py-3.5 rounded-2xl bg-muted/30 text-muted-foreground font-semibold text-[15px] active:scale-[0.98] transition-all"
              >
                Verder meten
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ActionCard({ icon, label, description, onClick, compact, primary, saveStyle }: {
  icon: React.ReactNode; label: string; description: string; onClick: () => void; compact?: boolean; primary?: boolean; saveStyle?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3.5 rounded-2xl transition-all duration-150',
        'active:scale-[0.98] text-left',
        compact ? 'p-3.5' : 'p-4',
        saveStyle
          ? 'bg-card border border-border/40'
          : primary
            ? 'bg-[hsl(var(--tenant-primary)/0.04)]'
            : 'bg-card'
      )}
    >
      <div className={cn(
        'rounded-xl flex items-center justify-center shrink-0',
        compact ? 'w-9 h-9' : 'w-10 h-10',
        saveStyle
          ? 'bg-muted/20 text-muted-foreground/50'
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
          'text-foreground'
        )}>{label}</p>
        <p className={cn(
          'text-muted-foreground/40 leading-snug',
          compact ? 'text-[11px] mt-0.5' : 'text-[12px] mt-0.5'
        )}>{description}</p>
      </div>
    </button>
  );
}
