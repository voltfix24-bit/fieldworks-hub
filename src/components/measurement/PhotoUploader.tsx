import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, X, Upload, ImageIcon } from 'lucide-react';
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
    <div className="space-y-1.5">
      <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">{label}</p>
      {displayUrl ? (
        <div className="relative group rounded-lg overflow-hidden border border-border">
          <img src={displayUrl} alt={label} className="w-full h-28 sm:h-32 object-cover" />
          <div className="absolute inset-0 bg-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button size="sm" variant="secondary" onClick={() => inputRef.current?.click()} disabled={uploading} className="h-8 text-xs">
              <Camera className="h-3 w-3 mr-1" /> Vervangen
            </Button>
            {onRemove && (
              <Button size="sm" variant="destructive" onClick={onRemove} disabled={uploading} className="h-8 w-8 p-0"><X className="h-3 w-3" /></Button>
            )}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={cn(
            'w-full h-24 sm:h-28 rounded-lg border-2 border-dashed border-border',
            'flex flex-col items-center justify-center gap-1.5',
            'text-muted-foreground/50 hover:border-accent/40 hover:text-accent/70',
            'transition-all active:scale-[0.99]'
          )}
        >
          <ImageIcon className="h-5 w-5" />
          <span className="text-[10px] font-medium">{uploading ? 'Uploaden…' : 'Foto uploaden'}</span>
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" />
    </div>
  );
}
