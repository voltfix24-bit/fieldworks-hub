import { useState, useRef, forwardRef } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, X, Image as ImageIcon, Loader2, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PhotoUploaderProps {
  label: string;
  currentUrl?: string | null;
  onUpload: (file: File) => Promise<void>;
  onRemove?: () => void;
  uploading?: boolean;
  compact?: boolean;
}

export const PhotoUploader = forwardRef<HTMLDivElement, PhotoUploaderProps>(function PhotoUploader({ label, currentUrl, onUpload, onRemove, uploading, compact }, ref) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const filesRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    await onUpload(file);
  };

  const displayUrl = preview || currentUrl;

  return (
    <div ref={ref}>
      <p className={cn(
        'uppercase tracking-widest font-semibold text-muted-foreground/70',
        compact ? 'text-[9px] mb-1' : 'text-[11px] mb-2'
      )}>{label}</p>

      {displayUrl ? (
        <div className="relative group rounded-lg overflow-hidden border border-border/50 bg-muted/20">
          <img src={displayUrl} alt={label} className={cn('w-full object-cover', compact ? 'h-24' : 'h-32 sm:h-36')} />
          <div className="absolute inset-0 bg-foreground/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 active:opacity-100 transition-all duration-200 flex items-center justify-center gap-1.5">
            <Button size="sm" variant="secondary" onClick={() => cameraRef.current?.click()} disabled={uploading} className="h-7 text-[10px] font-medium shadow-sm px-2">
              <Camera className="h-3 w-3 mr-1" /> Vervangen
            </Button>
            {onRemove && (
              <Button size="icon" variant="destructive" onClick={onRemove} disabled={uploading} className="h-7 w-7 shadow-sm">
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className={cn(
          'w-full rounded-lg border border-dashed border-border/50 bg-muted/10 overflow-hidden',
          compact ? 'h-20' : 'h-28 sm:h-32'
        )}>
          {uploading ? (
            <div className="h-full flex flex-col items-center justify-center gap-1.5 text-muted-foreground/40">
              <Loader2 className={cn('animate-spin', compact ? 'h-4 w-4' : 'h-5 w-5')} />
              <span className={cn('font-medium', compact ? 'text-[9px]' : 'text-[11px]')}>Uploaden…</span>
            </div>
          ) : (
            <div className="h-full grid grid-cols-3">
              <button
                type="button"
                onClick={() => cameraRef.current?.click()}
                className="flex flex-col items-center justify-center gap-1 text-muted-foreground/40 hover:text-primary/60 hover:bg-primary/[0.03] transition-all active:scale-[0.97] border-r border-dashed border-border/30"
              >
                <Camera className={cn(compact ? 'h-4 w-4' : 'h-5 w-5')} />
                <span className={cn('font-medium', compact ? 'text-[8px]' : 'text-[10px]')}>Camera</span>
              </button>
              <button
                type="button"
                onClick={() => galleryRef.current?.click()}
                className="flex flex-col items-center justify-center gap-1 text-muted-foreground/40 hover:text-primary/60 hover:bg-primary/[0.03] transition-all active:scale-[0.97] border-r border-dashed border-border/30"
              >
                <ImageIcon className={cn(compact ? 'h-4 w-4' : 'h-5 w-5')} />
                <span className={cn('font-medium', compact ? 'text-[8px]' : 'text-[10px]')}>Galerij</span>
              </button>
              <button
                type="button"
                onClick={() => filesRef.current?.click()}
                className="flex flex-col items-center justify-center gap-1 text-muted-foreground/40 hover:text-primary/60 hover:bg-primary/[0.03] transition-all active:scale-[0.97]"
              >
                <FolderOpen className={cn(compact ? 'h-4 w-4' : 'h-5 w-5')} />
                <span className={cn('font-medium', compact ? 'text-[8px]' : 'text-[10px]')}>Bestanden</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Camera — opens native camera */}
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" />
      {/* Gallery — opens photo library */}
      <input ref={galleryRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
      {/* Files — opens file picker for any supported file */}
      <input ref={filesRef} type="file" accept="image/*,.pdf,.heic,.webp" onChange={handleFile} className="hidden" />
    </div>
  );
}
