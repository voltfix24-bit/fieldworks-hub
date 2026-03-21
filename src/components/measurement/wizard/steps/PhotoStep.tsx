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
  uploading, penCode, compact,
}: PhotoStepProps) {
  return (
    <div>
      <div className={compact ? 'mb-2' : 'mb-4'}>
        <h2 className={cn(
          'font-bold text-foreground tracking-tight',
          compact ? 'text-[14px]' : 'text-[15px]'
        )}>
          Foto's — {penCode}
        </h2>
        <p className={cn(
          'text-muted-foreground/70 mt-0.5 font-medium',
          compact ? 'text-[11px]' : 'text-[13px]'
        )}>
          Detail- en overzichtsfoto
        </p>
      </div>

      <div className={compact ? 'grid grid-cols-2 gap-2' : 'space-y-5'}>
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
