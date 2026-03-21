import { useState, useRef } from 'react';
import { Camera, Image as ImageIcon, X, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { uploadMeasurementPhoto } from '@/hooks/use-attachments';
import { toast } from '@/hooks/use-toast';

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

      <div className={compact ? 'grid grid-cols-2 gap-3' : 'space-y-5'}>
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
        <div className="relative inline-block">
          <img
            src={currentUrl}
            alt={label}
            className="w-20 h-20 rounded-xl object-cover"
          />
          <button
            onClick={onRemove}
            disabled={isLoading}
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

      {isLoading ? (
        <div className={cn(
          'rounded-xl border border-dashed border-border/40 bg-muted/10 flex items-center justify-center gap-1.5',
          compact ? 'h-20' : 'h-24'
        )}>
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground/30" />
          <span className={cn('text-muted-foreground/30 font-medium', compact ? 'text-[10px]' : 'text-[11px]')}>Uploaden…</span>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            disabled={isLoading}
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
            disabled={isLoading}
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
