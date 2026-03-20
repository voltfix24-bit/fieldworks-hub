import { PhotoUploader } from '../../PhotoUploader';

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
      {/* Compact title instead of WizardStepHeader */}
      <div className={compact ? 'mb-2' : 'mb-4'}>
        <h2 className={`font-semibold text-foreground tracking-tight ${compact ? 'text-[13px]' : 'text-[15px]'}`}>
          Foto's — {penCode}
        </h2>
        <p className={`text-muted-foreground mt-0.5 ${compact ? 'text-[11px]' : 'text-[13px]'}`}>
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
