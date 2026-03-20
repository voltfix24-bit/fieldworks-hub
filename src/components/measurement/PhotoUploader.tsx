import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, X, ImageIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PhotoUploaderProps {
  label: string;
  currentUrl?: string | null;
  onUpload: (file: File) => Promise<void>;
  onRemove?: () => void;
  uploading?: boolean;
  compact?: boolean;
}

export function PhotoUploader({ label, currentUrl, onUpload, onRemove, uploading, compact }: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    await onUpload(file);
  };

  const displayUrl = preview || currentUrl;

  return (
    <div>
      <p className={cn(
        'uppercase tracking-widest font-semibold text-muted-foreground/70',
        compact ? 'text-[9px] mb-1' : 'text-[11px] mb-2'
      )}>{label}</p>

      {displayUrl ? (
        <div className={cn(
          'relative group rounded-lg overflow-hidden border border-border/50 bg-muted/20',
        )}>
          <img src={displayUrl} alt={label} className={cn('w-full object-cover', compact ? 'h-24' : 'h-32 sm:h-36')} />
          <div className="absolute inset-0 bg-foreground/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center gap-1.5">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="h-7 text-[10px] font-medium shadow-sm px-2"
            >
              <Camera className="h-3 w-3 mr-1" /> Vervangen
            </Button>
            {onRemove && (
              <Button
                size="icon"
                variant="destructive"
                onClick={onRemove}
                disabled={uploading}
                className="h-7 w-7 shadow-sm"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={cn(
            'w-full rounded-lg',
            'border border-dashed border-border/50 bg-muted/10',
            'flex flex-col items-center justify-center gap-1.5',
            'text-muted-foreground/40',
            'hover:border-primary/30 hover:text-primary/50 hover:bg-primary/3',
            'transition-all duration-150 active:scale-[0.995]',
            compact ? 'h-20' : 'h-28 sm:h-32'
          )}
        >
          {uploading ? (
            <Loader2 className={cn('animate-spin', compact ? 'h-4 w-4' : 'h-5 w-5')} />
          ) : (
            <ImageIcon className={cn(compact ? 'h-4 w-4' : 'h-5 w-5')} />
          )}
          <span className={cn('font-medium', compact ? 'text-[9px]' : 'text-[11px]')}>
            {uploading ? 'Uploaden…' : 'Tik om foto te maken'}
          </span>
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" />
    </div>
  );
}
