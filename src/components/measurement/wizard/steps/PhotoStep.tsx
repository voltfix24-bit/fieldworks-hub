import { useState, useRef } from 'react';
import { Camera, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PhotoStepProps {
  electrodeCode: string;
  displayPhotoUrl: string | null;
  overviewPhotoUrl: string | null;
  onUpload: (type: 'display_photo_url' | 'overview_photo_url', file: File) => Promise<void>;
  onRemove: (type: 'display_photo_url' | 'overview_photo_url') => void;
  uploading: boolean;
  compact?: boolean;
}

export function PhotoStep({ electrodeCode, displayPhotoUrl, overviewPhotoUrl, onUpload, onRemove, uploading, compact }: PhotoStepProps) {
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

      <div className="space-y-4">
        <PhotoSlot
          label="Meetdisplay foto"
          description="Close-up van het meetapparaat"
          currentUrl={displayPhotoUrl}
          onUpload={(file) => onUpload('display_photo_url', file)}
          onRemove={() => onRemove('display_photo_url')}
          uploading={uploading}
          compact={compact}
        />
        <PhotoSlot
          label="Overzichtsfoto"
          description="Bredere opname van de locatie"
          currentUrl={overviewPhotoUrl}
          onUpload={(file) => onUpload('overview_photo_url', file)}
          onRemove={() => onRemove('overview_photo_url')}
          uploading={uploading}
          compact={compact}
        />
      </div>
    </div>
  );
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

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLocalUploading(true);
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
