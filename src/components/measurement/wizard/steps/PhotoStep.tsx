import { PhotoUploader } from '../../PhotoUploader';
import { cn } from '@/lib/utils';

interface PhotoStepProps {
  displayPhotoUrl: string | null;
  overviewPhotoUrl: string | null;
  onUploadDisplay: (file: File) => Promise<void>;
  onUploadOverview: (file: File) => Promise<void>;
  onRemoveDisplay: () => void;
  onRemoveOverview: () => void;
  uploading: boolean;
  penCode: string;
  electrodeCode?: string;
  compact?: boolean;
}

export function PhotoStep({
  displayPhotoUrl, overviewPhotoUrl,
  onUploadDisplay, onUploadOverview,
  onRemoveDisplay, onRemoveOverview,
  uploading, penCode, electrodeCode, compact,
}: PhotoStepProps) {
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
          {electrodeCode ? `${electrodeCode} · ${penCode}` : penCode}
        </p>
      </div>

      <div className={compact ? 'grid grid-cols-2 gap-3' : 'space-y-5'}>
        <PhotoUploader
          label="Detailfoto"
          currentUrl={displayPhotoUrl}
          onUpload={onUploadDisplay}
          onRemove={onRemoveDisplay}
          uploading={uploading}
          compact={compact}
        />
        <PhotoUploader
          label="Overzichtsfoto"
          currentUrl={overviewPhotoUrl}
          onUpload={onUploadOverview}
          onRemove={onRemoveOverview}
          uploading={uploading}
          compact={compact}
        />
      </div>
    </div>
  );
}
