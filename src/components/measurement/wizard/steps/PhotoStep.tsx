import { useState, useRef } from 'react';
import { Camera, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fotoNaarBase64 } from '@/hooks/useRapportGenerator';

interface PhotoStepProps {
  electrodeCode: string;
  fotoDisplayB64: string | null;
  fotoOverzichtB64: string | null;
  onFotoChange: (field: 'foto_display_b64' | 'foto_overzicht_b64', value: string | null) => void;
  compact?: boolean;
}

export function PhotoStep({ electrodeCode, fotoDisplayB64, fotoOverzichtB64, onFotoChange, compact }: PhotoStepProps) {
  return (
    <div>
      <div className={compact ? 'mb-3' : 'mb-5'}>
        <h2 className={cn(
          'font-bold text-foreground tracking-tight',
          compact ? 'text-[16px]' : 'text-[17px]'
        )}>
          Foto's
        </h2>
        <p className={cn(
          'text-muted-foreground/50 mt-0.5',
          compact ? 'text-[12px]' : 'text-[13px]'
        )}>
          {electrodeCode}
        </p>
      </div>

      <div className={compact ? 'grid grid-cols-2 gap-3' : 'space-y-5'}>
        <ElectrodePhotoSlot
          label="Meetdisplay foto"
          description="Close-up van het meetapparaat"
          base64={fotoDisplayB64}
          onSet={(b64) => onFotoChange('foto_display_b64', b64)}
          onRemove={() => onFotoChange('foto_display_b64', null)}
          compact={compact}
        />
        <ElectrodePhotoSlot
          label="Overzichtsfoto"
          description="Bredere opname van de locatie"
          base64={fotoOverzichtB64}
          onSet={(b64) => onFotoChange('foto_overzicht_b64', b64)}
          onRemove={() => onFotoChange('foto_overzicht_b64', null)}
          compact={compact}
        />
      </div>
    </div>
  );
}

/* ── Individual photo slot ── */

function ElectrodePhotoSlot({ label, description, base64, onSet, onRemove, compact }: {
  label: string;
  description: string;
  base64: string | null;
  onSet: (b64: string) => void;
  onRemove: () => void;
  compact?: boolean;
}) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const b64 = await fotoNaarBase64(file);
      onSet(b64);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  if (base64) {
    return (
      <div>
        <p className={cn(
          'font-medium text-muted-foreground/50 mb-2',
          compact ? 'text-[10px]' : 'text-[11px]'
        )}>{label}</p>
        <div className="relative inline-block">
          <img
            src={`data:image/jpeg;base64,${base64}`}
            alt={label}
            className="w-20 h-20 rounded-xl object-cover"
          />
          <button
            onClick={onRemove}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-sm active:scale-90 transition-transform"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className={cn(
        'font-medium text-muted-foreground/50 mb-1',
        compact ? 'text-[10px]' : 'text-[11px]'
      )}>{label}</p>
      <p className={cn(
        'text-muted-foreground/30 mb-2',
        compact ? 'text-[9px]' : 'text-[10px]'
      )}>{description}</p>

      {loading ? (
        <div className={cn(
          'rounded-xl border border-dashed border-border/40 bg-muted/10 flex items-center justify-center',
          compact ? 'h-20' : 'h-24'
        )}>
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/30" />
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            className={cn(
              'flex items-center gap-1.5 rounded-xl font-medium transition-all active:scale-[0.96]',
              'bg-[#F4896B]/10 text-[#F4896B]',
              compact ? 'px-3 py-2 text-[11px]' : 'px-3.5 py-2.5 text-[12px]'
            )}
          >
            <Camera className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
            Camera
          </button>
          <button
            type="button"
            onClick={() => galleryRef.current?.click()}
            className={cn(
              'flex items-center gap-1.5 rounded-xl font-medium transition-all active:scale-[0.96]',
              'bg-[#F4896B]/10 text-[#F4896B]',
              compact ? 'px-3 py-2 text-[11px]' : 'px-3.5 py-2.5 text-[12px]'
            )}
          >
            <ImageIcon className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
            Galerij
          </button>
        </div>
      )}

      <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" />
      <input ref={galleryRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
    </div>
  );
}
