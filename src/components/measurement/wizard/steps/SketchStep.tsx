import { WizardStepHeader } from '../WizardStepHeader';
import { SketchAttachmentsSection } from '../../SketchAttachmentsSection';

interface SketchStepProps {
  projectId: string;
  tenantId: string;
  sessionId?: string;
}

export function SketchStep({ projectId, tenantId, sessionId }: SketchStepProps) {
  return (
    <div>
      <WizardStepHeader
        title="Schets & Bijlagen"
        subtitle="Upload optioneel een schets, foto of ander bestand"
      />

      <SketchAttachmentsSection projectId={projectId} tenantId={tenantId} sessionId={sessionId} />
    </div>
  );
}
