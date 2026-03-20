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
  compact?: boolean;
}

export function PhotoStep({
  displayPhotoUrl, overviewPhotoUrl,
  onUploadDisplay, onUploadOverview,
  onRemoveDisplay, onRemoveOverview,
  uploading, penCode, compact,
}: PhotoStepProps) {
  return (
    <div>
      <div className={compact ? 'mb-1.5' : 'mb-4'}>
        <h2 className={cn(
          'font-semibold text-foreground tracking-tight',
          compact ? 'text-[12px]' : 'text-[15px]'
        )}>
          Foto's — {penCode}
        </h2>
        <p className={cn(
          'text-muted-foreground/60 mt-0.5',
          compact ? 'text-[10px]' : 'text-[13px]'
        )}>
          Detail- en overzichtsfoto
        </p>
      </div>

      <div className={compact ? 'grid grid-cols-2 gap-1.5' : 'space-y-5'}>
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
