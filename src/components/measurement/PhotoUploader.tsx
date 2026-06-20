import { useState, useRef, forwardRef } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, X, Image as ImageIcon, Loader2, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MeasurementPhoto } from '@/components/ui/MeasurementPhoto';
import { toast } from '@/hooks/use-toast';

interface PhotoUploaderProps {
  label: string;
  currentUrl?: string | null;
  onUpload: (file: File) => Promise<void>;
  onRemove?: () => void;
  uploading?: boolean;
  compact?: boolean;
}

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_EXT = /\.(jpe?g|png|webp)$/i;
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

function validateImage(file: File): string | null {
  if (!ALLOWED_MIME.includes(file.type.toLowerCase()) || !ALLOWED_EXT.test(file.name)) {
    return 'Alleen JPEG, PNG of WebP toegestaan.';
  }
  if (file.size > MAX_BYTES) {
    return `Bestand is te groot (max ${Math.round(MAX_BYTES / 1024 / 1024)} MB).`;
  }
  if (file.size === 0) {
    return 'Bestand is leeg.';
  }
  return null;
}

export const PhotoUploader = forwardRef<HTMLDivElement, PhotoUploaderProps>(function PhotoUploader({ label, currentUrl, onUpload, onRemove, uploading, compact }, ref) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const filesRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const err = validateImage(file);
    if (err) {
      toast({ title: 'Foto niet geaccepteerd', description: err, variant: 'destructive' });
      return;
    }
    setPreview(URL.createObjectURL(file));
    await onUpload(file);
  };


  const displayUrl = preview || currentUrl;

  return (
    <div ref={ref}>
      <p className={cn(
        'font-medium text-muted-foreground/50',
        compact ? 'text-[10px] mb-1.5' : 'text-[11px] mb-2'
      )}>{label}</p>

      {displayUrl ? (
        <div className="relative group rounded-2xl overflow-hidden bg-muted/10">
          <MeasurementPhoto src={displayUrl} alt={label} className={cn('w-full object-cover', compact ? 'h-28' : 'h-36')} />
          <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 active:opacity-100 transition-all duration-200 flex items-center justify-center gap-2">
            <button onClick={() => cameraRef.current?.click()} disabled={uploading}
              className="h-8 px-3 rounded-lg bg-white/90 text-foreground text-[11px] font-medium flex items-center gap-1.5 active:scale-95 transition-transform">
              <Camera className="h-3.5 w-3.5" /> Vervangen
            </button>
            {onRemove && (
              <button onClick={onRemove} disabled={uploading}
                className="h-8 w-8 rounded-lg bg-white/90 text-destructive flex items-center justify-center active:scale-95 transition-transform">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className={cn(
          'w-full rounded-2xl bg-muted/20 overflow-hidden',
          compact ? 'h-24' : 'h-32'
        )}>
          {uploading ? (
            <div className="h-full flex flex-col items-center justify-center gap-1.5 text-muted-foreground/30">
              <Loader2 className={cn('animate-spin', compact ? 'h-4 w-4' : 'h-5 w-5')} />
              <span className={cn('font-medium', compact ? 'text-[10px]' : 'text-[11px]')}>Uploaden…</span>
            </div>
          ) : (
            <div className="h-full grid grid-cols-3 divide-x divide-border/10">
              <UploadOption icon={Camera} label="Camera" onClick={() => cameraRef.current?.click()} compact={compact} />
              <UploadOption icon={ImageIcon} label="Galerij" onClick={() => galleryRef.current?.click()} compact={compact} />
              <UploadOption icon={FolderOpen} label="Bestanden" onClick={() => filesRef.current?.click()} compact={compact} />
            </div>
          )}
        </div>
      )}

      <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" />
      <input ref={galleryRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
      <input ref={filesRef} type="file" accept="image/*,.pdf,.heic,.webp" onChange={handleFile} className="hidden" />
    </div>
  );
});

function UploadOption({ icon: Icon, label, onClick, compact }: {
  icon: React.ElementType; label: string; onClick: () => void; compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-1 text-muted-foreground/30 active:text-muted-foreground/50 active:bg-muted/10 transition-all active:scale-[0.96]"
    >
      <Icon className={cn(compact ? 'h-4 w-4' : 'h-5 w-5')} />
      <span className={cn('font-medium', compact ? 'text-[9px]' : 'text-[10px]')}>{label}</span>
    </button>
  );
}
