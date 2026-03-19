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
}

export function PhotoUploader({ label, currentUrl, onUpload, onRemove, uploading }: PhotoUploaderProps) {
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
    <div className="space-y-2">
      <p className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground/70">{label}</p>
      {displayUrl ? (
        <div className="relative group rounded-xl overflow-hidden border border-border/60 bg-muted/20">
          <img src={displayUrl} alt={label} className="w-full h-32 sm:h-36 object-cover" />
          <div className="absolute inset-0 bg-foreground/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="h-9 text-xs font-medium shadow-sm"
            >
              <Camera className="h-3.5 w-3.5 mr-1.5" /> Vervangen
            </Button>
            {onRemove && (
              <Button
                size="icon"
                variant="destructive"
                onClick={onRemove}
                disabled={uploading}
                className="h-9 w-9 shadow-sm"
              >
                <X className="h-3.5 w-3.5" />
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
            'w-full h-28 sm:h-32 rounded-xl',
            'border border-dashed border-border/60 bg-muted/10',
            'flex flex-col items-center justify-center gap-2',
            'text-muted-foreground/40',
            'hover:border-primary/30 hover:text-primary/50 hover:bg-primary/3',
            'transition-all duration-150 active:scale-[0.995]'
          )}
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <ImageIcon className="h-5 w-5" />
          )}
          <span className="text-[11px] font-medium">
            {uploading ? 'Uploaden…' : 'Tik om foto te maken'}
          </span>
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" />
    </div>
  );
}
