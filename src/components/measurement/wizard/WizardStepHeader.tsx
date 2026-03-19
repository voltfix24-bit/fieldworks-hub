import { GroundingIcon } from '../GroundingIcon';

interface WizardStepHeaderProps {
  title: string;
  subtitle?: string;
}

export function WizardStepHeader({ title, subtitle }: WizardStepHeaderProps) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        <GroundingIcon size={20} className="text-primary" />
      </div>
      <div>
        <h2 className="text-base font-semibold text-foreground leading-tight">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}
