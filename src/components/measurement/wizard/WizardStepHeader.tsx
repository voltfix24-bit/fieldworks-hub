import { GroundingIcon } from '../GroundingIcon';

interface WizardStepHeaderProps {
  title: string;
  subtitle?: string;
}

export function WizardStepHeader({ title, subtitle }: WizardStepHeaderProps) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className="w-9 h-9 rounded-lg bg-primary/8 flex items-center justify-center shrink-0 mt-0.5">
        <GroundingIcon size={18} className="text-primary" />
      </div>
      <div>
        <h2 className="text-[15px] font-semibold text-foreground leading-snug tracking-tight">{title}</h2>
        {subtitle && <p className="text-[13px] text-muted-foreground mt-0.5 leading-relaxed">{subtitle}</p>}
      </div>
    </div>
  );
}
