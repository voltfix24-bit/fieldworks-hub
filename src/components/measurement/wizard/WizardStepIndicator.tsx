import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface WizardStepIndicatorProps {
  steps: { label: string; key: string }[];
  currentStep: number;
}

export function WizardStepIndicator({ steps, currentStep }: WizardStepIndicatorProps) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-1 px-1">
      {steps.map((step, i) => {
        const isActive = i === currentStep;
        const isCompleted = i < currentStep;
        return (
          <div key={step.key} className="flex items-center gap-1 shrink-0">
            <div className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium transition-all',
              isActive && 'bg-primary text-primary-foreground shadow-sm',
              isCompleted && 'bg-primary/10 text-primary',
              !isActive && !isCompleted && 'text-muted-foreground'
            )}>
              {isCompleted ? (
                <Check className="h-3 w-3" />
              ) : (
                <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[10px] font-bold">
                  {i + 1}
                </span>
              )}
              <span className="hidden sm:inline whitespace-nowrap">{step.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={cn(
                'w-4 h-px',
                i < currentStep ? 'bg-primary/40' : 'bg-border'
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}
