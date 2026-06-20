import { useNavigate } from 'react-router-dom';
import { Map } from 'lucide-react';
import { WizardStepHeader } from '../WizardStepHeader';
import { SketchAttachmentsSection } from '../../SketchAttachmentsSection';

interface SketchStepProps {
  projectId: string;
  tenantId: string;
  sessionId?: string;
}

export function SketchStep({ projectId, tenantId, sessionId }: SketchStepProps) {
  const navigate = useNavigate();
  return (
    <div>
      <WizardStepHeader
        title="Schets & Bijlagen"
        subtitle="Maak een situatieschets of upload foto's en bestanden"
      />

      <button
        onClick={() => navigate(`/projects/${projectId}/diagram`)}
        className="w-full mb-3 flex items-center gap-3 px-4 py-3.5 rounded-xl border border-[hsl(var(--tenant-primary,var(--primary))/0.3)] bg-[hsl(var(--tenant-primary,var(--primary))/0.06)] text-[hsl(var(--tenant-primary,var(--primary)))] active:scale-[0.98] transition-all"
      >
        <Map className="h-4 w-4" />
        <div className="flex-1 text-left">
          <div className="text-[13px] font-semibold">Situatieschets maken</div>
          <div className="text-[11px] opacity-70">MSR-kast + elektrodes plaatsen</div>
        </div>
      </button>

      <SketchAttachmentsSection projectId={projectId} tenantId={tenantId} sessionId={sessionId} />
    </div>
  );
}
