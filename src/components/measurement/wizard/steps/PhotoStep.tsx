import { WizardStepHeader } from '../WizardStepHeader';
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
}

export function PhotoStep({
  displayPhotoUrl, overviewPhotoUrl,
  onUploadDisplay, onUploadOverview,
  onRemoveDisplay, onRemoveOverview,
  uploading, penCode,
}: PhotoStepProps) {
  return (
    <div className="space-y-4">
      <WizardStepHeader
        title={`Foto's — ${penCode}`}
        subtitle="Upload een detail- en overzichtsfoto voor deze pen"
      />

      <div className="space-y-4">
        <PhotoUploader
          label="Detailfoto"
          currentUrl={displayPhotoUrl}
          onUpload={onUploadDisplay}
          onRemove={onRemoveDisplay}
          uploading={uploading}
        />
        <PhotoUploader
          label="Overzichtsfoto"
          currentUrl={overviewPhotoUrl}
          onUpload={onUploadOverview}
          onRemove={onRemoveOverview}
          uploading={uploading}
        />
      </div>
    </div>
  );
}
