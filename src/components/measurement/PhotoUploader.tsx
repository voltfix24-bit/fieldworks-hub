import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, X, Upload } from 'lucide-react';

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
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      {displayUrl ? (
        <div className="relative group">
          <img src={displayUrl} alt={label} className="w-full h-32 object-cover rounded-md border border-border" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center gap-2">
            <Button size="sm" variant="secondary" onClick={() => inputRef.current?.click()} disabled={uploading}>
              <Camera className="h-3 w-3 mr-1" /> Vervangen
            </Button>
            {onRemove && (
              <Button size="sm" variant="destructive" onClick={onRemove} disabled={uploading}><X className="h-3 w-3" /></Button>
            )}
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
          className="w-full h-24 border-2 border-dashed border-border rounded-md flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors">
          <Upload className="h-5 w-5" />
          <span className="text-xs">{uploading ? 'Uploaden…' : 'Foto uploaden'}</span>
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" />
    </div>
  );
}
