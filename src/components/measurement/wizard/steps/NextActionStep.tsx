import { useState } from 'react';
import { Paperclip, Save, PenTool } from 'lucide-react';
import { GroundingIcon } from '../../GroundingIcon';
import { cn } from '@/lib/utils';
import HandtekeningPad from '../../HandtekeningPad';
import { useHandtekening } from '@/hooks/useHandtekening';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

interface ElektrodeSamenvatting {
  id: string;
  code: string;
  eindtype: 'RA' | 'RV';
  eindwaarde: number | null;
  targetValue: number | null;
  heeftDisplayFoto: boolean;
  heeftOverzichtFoto: boolean;
}

interface NextActionStepProps {
  onGoToSketch: () => void;
  onSave: () => void;
  compact?: boolean;
  onHandtekeningChange?: (base64: string | null) => void;
  elektrodes?: ElektrodeSamenvatting[];
}

export function NextActionStep({ onGoToSketch, onSave, compact, onHandtekeningChange, elektrodes = [] }: NextActionStepProps) {
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

      {/* DEEL 2 — Samenvatting */}
      {elektrodes.length > 0 && (
        <div className="mb-5 rounded-2xl bg-card border border-border/30 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/20">
            <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground/50">
              Samenvatting
            </span>
            <span className={cn(
              'text-[11px] font-bold px-2 py-0.5 rounded-full',
              elektrodes.every(e =>
                e.eindwaarde !== null &&
                e.targetValue !== null &&
                e.eindwaarde <= e.targetValue
              )
                ? 'bg-[hsl(var(--status-completed)/0.1)] text-[hsl(var(--status-completed))]'
                : 'bg-amber-500/10 text-amber-600'
            )}>
              {elektrodes.filter(e =>
                e.eindwaarde !== null &&
                e.targetValue !== null &&
                e.eindwaarde <= e.targetValue
              ).length}/{elektrodes.length} voldoet
            </span>
          </div>
          <div className="divide-y divide-border/15">
            {elektrodes.map((e, i) => {
              const heeftWaarde = e.eindwaarde !== null;
              const voldoet = heeftWaarde && e.targetValue !== null && e.eindwaarde! <= e.targetValue;
              const fotosOk = e.heeftDisplayFoto && e.heeftOverzichtFoto;
              const fotosDeels = e.heeftDisplayFoto || e.heeftOverzichtFoto;

              return (
                <div key={e.id} className="flex items-center gap-3 px-4 py-3">
                  <div className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold',
                    voldoet
                      ? 'bg-[hsl(var(--status-completed)/0.1)] text-[hsl(var(--status-completed))]'
                      : heeftWaarde
                        ? 'bg-destructive/10 text-destructive'
                        : 'bg-muted/30 text-muted-foreground/40'
                  )}>
                    {voldoet ? '✓' : heeftWaarde ? '✗' : i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-foreground">{e.code}</p>
                    <p className={cn(
                      'text-[11px] font-medium',
                      voldoet
                        ? 'text-[hsl(var(--status-completed))]'
                        : heeftWaarde
                          ? 'text-destructive'
                          : 'text-muted-foreground/40'
                    )}>
                      {heeftWaarde
                        ? `${e.eindtype} · ${String(e.eindwaarde).replace('.', ',')} Ω`
                        : 'Geen waarde'
                      }
                    </p>
                  </div>
                  <div className={cn(
                    'flex items-center gap-1 text-[10px] font-semibold shrink-0',
                    fotosOk
                      ? 'text-[hsl(var(--status-completed))]'
                      : fotosDeels
                        ? 'text-amber-500'
                        : 'text-muted-foreground/25'
                  )}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <rect x="3" y="5" width="18" height="15" rx="2" stroke="currentColor" strokeWidth="2"/>
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    {fotosOk ? '2/2' : fotosDeels ? '1/2' : '0/2'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className={compact ? 'space-y-2' : 'space-y-2.5'}>
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
