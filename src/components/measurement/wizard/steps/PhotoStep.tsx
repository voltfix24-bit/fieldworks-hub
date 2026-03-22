import { useState, useRef } from 'react';
import { Camera, Image as ImageIcon, X, Loader2, AlertTriangle } from 'lucide-react';
import { GroundingIcon } from '../../GroundingIcon';
import { cn } from '@/lib/utils';

export interface ElektrodeMetFotos {
  id: string;
  code: string;
  displayPhotoUrl: string | null;
  overviewPhotoUrl: string | null;
  uploading: boolean;
}

interface PhotoStepProps {
  elektrodes: ElektrodeMetFotos[];
  onUpload: (electrodeId: string, type: 'display_photo_url' | 'overview_photo_url', file: File) => Promise<void>;
  onRemove: (electrodeId: string, type: 'display_photo_url' | 'overview_photo_url') => void;
  compact?: boolean;
}

export function PhotoStep({ elektrodes, onUpload, onRemove, compact }: PhotoStepProps) {
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
          Optioneel — per elektrode
        </p>
      </div>

      <div className="space-y-5">
        {elektrodes.map((elektrode, idx) => (
          <div key={elektrode.id}>
            {/* Elektrode header */}
            {elektrodes.length > 1 && (
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-[hsl(var(--tenant-primary,var(--primary))/0.1)] flex items-center justify-center">
                  <span className="text-[10px] font-bold text-[hsl(var(--tenant-primary,var(--primary)))]">{idx + 1}</span>
                </div>
                <span className={cn('font-semibold text-foreground', compact ? 'text-[13px]' : 'text-[14px]')}>
                  {elektrode.code}
                </span>
              </div>
            )}

            {/* Twee foto slots */}
            <div className="space-y-4">
              <PhotoSlot
                label="Meetdisplay foto"
                description="Close-up van het meetapparaat"
                currentUrl={elektrode.displayPhotoUrl}
                onUpload={(file) => onUpload(elektrode.id, 'display_photo_url', file)}
                onRemove={() => onRemove(elektrode.id, 'display_photo_url')}
                uploading={elektrode.uploading}
                compact={compact}
              />
              <PhotoSlot
                label="Overzichtsfoto"
                description="Bredere opname van de locatie"
                currentUrl={elektrode.overviewPhotoUrl}
                onUpload={(file) => onUpload(elektrode.id, 'overview_photo_url', file)}
                onRemove={() => onRemove(elektrode.id, 'overview_photo_url')}
                uploading={elektrode.uploading}
                compact={compact}
              />
            </div>

            {/* Scheiding tussen elektrodes */}
            {idx < elektrodes.length - 1 && (
              <div className="border-b border-border/10 my-5" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Photo quality check ── */
function controleerFotoKwaliteit(file: File): Promise<{ ok: boolean; reden?: string }> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = Math.min(img.width, 200);
        canvas.height = Math.min(img.height, 200);
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;
        let totalHelderheid = 0;
        const aantalPixels = pixels.length / 4;

        for (let i = 0; i < pixels.length; i += 4) {
          totalHelderheid += (pixels[i] * 0.299 + pixels[i + 1] * 0.587 + pixels[i + 2] * 0.114);
        }

        const gemHelderheid = totalHelderheid / aantalPixels;
        URL.revokeObjectURL(url);

        if (gemHelderheid < 40) {
          resolve({ ok: false, reden: 'te donker' });
        } else if (gemHelderheid > 240) {
          resolve({ ok: false, reden: 'overbelicht' });
        } else {
          resolve({ ok: true });
        }
      } catch {
        URL.revokeObjectURL(url);
        resolve({ ok: true });
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ ok: true });
    };

    img.src = url;
  });
}

/* ── Individual photo slot ── */

function PhotoSlot({ label, description, currentUrl, onUpload, onRemove, uploading, compact }: {
  label: string;
  description: string;
  currentUrl: string | null;
  onUpload: (file: File) => Promise<void>;
  onRemove: () => void;
  uploading: boolean;
  compact?: boolean;
}) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [localUploading, setLocalUploading] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [kwaliteitsWaarschuwing, setKwaliteitsWaarschuwing] = useState<string | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLocalUploading(true);

    // DEEL 7 — Photo quality check
    const kwaliteit = await controleerFotoKwaliteit(file);
    if (!kwaliteit.ok) {
      setKwaliteitsWaarschuwing(kwaliteit.reden!);
      setTimeout(() => setKwaliteitsWaarschuwing(null), 4000);
    } else {
      setKwaliteitsWaarschuwing(null);
    }

    try {
      await onUpload(file);
    } catch {
      // error handled by parent
    } finally {
      setLocalUploading(false);
      e.target.value = '';
    }
  };

  const isLoading = localUploading || uploading;

  if (currentUrl) {
    return (
      <div>
        <p className={cn(
          'font-medium text-muted-foreground/50 mb-2',
          compact ? 'text-[10px]' : 'text-[11px]'
        )}>{label}</p>
        <div className="relative">
          <button
            type="button"
            onClick={() => setFullscreen(true)}
            className="rounded-xl overflow-hidden active:scale-[0.97] transition-transform w-full"
          >
            <img
              src={currentUrl}
              alt={label}
              className="w-full h-36 rounded-xl object-cover"
            />
          </button>
          <button
            onClick={onRemove}
            disabled={isLoading}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center shadow-sm active:scale-90 transition-transform"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Quality warning */}
        {kwaliteitsWaarschuwing && (
          <div className="flex items-center gap-1.5 mt-2 px-2.5 py-1.5 rounded-lg bg-amber-500/[0.08] border border-amber-500/20">
            <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
            <span className="text-[10px] font-medium text-amber-700 dark:text-amber-400">
              Foto lijkt {kwaliteitsWaarschuwing} — opnieuw proberen?
            </span>
            <button
              onClick={() => cameraRef.current?.click()}
              className="ml-auto text-[10px] font-bold text-amber-600 shrink-0"
            >
              Opnieuw
            </button>
          </div>
        )}

        {/* Fullscreen modal */}
        {fullscreen && (
          <div
            className="fixed inset-0 z-[500] bg-black/90 backdrop-blur-md flex items-center justify-center animate-in fade-in duration-200"
            onClick={() => setFullscreen(false)}
          >
            <img
              src={currentUrl}
              alt={label}
              className="max-w-[90vw] max-h-[85vh] object-contain rounded-xl"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setFullscreen(false)}
              className="absolute top-[max(16px,env(safe-area-inset-top))] right-4 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center active:scale-90 transition-transform"
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </div>
        )}

        <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" />
        <input ref={galleryRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
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

      {isLoading ? (
        <div className={cn(
          'rounded-xl border border-dashed border-border/40 bg-muted/10 flex items-center justify-center gap-1.5',
          'h-24'
        )}>
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground/30" />
          <span className="text-[11px] text-muted-foreground/30 font-medium">Uploaden…</span>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 w-full rounded-xl font-medium py-3 text-[13px] bg-[hsl(var(--tenant-primary,var(--primary))/0.08)] text-[hsl(var(--tenant-primary,var(--primary)))] active:scale-[0.98] transition-all"
          >
            <Camera className="h-4 w-4" />
            Camera
          </button>
          <button
            type="button"
            onClick={() => galleryRef.current?.click()}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 w-full rounded-xl font-medium py-3 text-[13px] bg-muted/30 text-muted-foreground/60 active:scale-[0.98] transition-all"
          >
            <ImageIcon className="h-4 w-4" />
            Galerij
          </button>
        </div>
      )}

      <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" />
      <input ref={galleryRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
    </div>
  );
}
