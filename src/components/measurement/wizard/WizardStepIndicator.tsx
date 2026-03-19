import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface WizardStepIndicatorProps {
  steps: { label: string; key: string }[];
  currentStep: number;
  onStepClick?: (stepIndex: number) => void;
}

export function WizardStepIndicator({ steps, currentStep, onStepClick }: WizardStepIndicatorProps) {
  return (
    <div className="flex items-center gap-0 overflow-x-auto scrollbar-none py-2 px-0.5">
      {steps.map((step, i) => {
        const isActive = i === currentStep;
        const isCompleted = i < currentStep;
        const isClickable = isCompleted && !!onStepClick;

        return (
          <div key={step.key} className="flex items-center shrink-0">
            <button
              type="button"
              disabled={!isClickable}
              onClick={() => isClickable && onStepClick(i)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-all duration-200',
                isActive && 'bg-primary text-primary-foreground shadow-sm shadow-primary/20',
                isCompleted && 'bg-primary/8 text-primary',
                !isActive && !isCompleted && 'text-muted-foreground/60',
                isClickable && 'cursor-pointer hover:bg-primary/15 active:scale-[0.97]',
                !isClickable && !isActive && 'cursor-default'
              )}
            >
              {isCompleted ? (
                <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
              ) : (
                <span className={cn(
                  'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold leading-none',
                  isActive ? 'bg-primary-foreground/20' : 'border border-current opacity-50'
                )}>
                  {i + 1}
                </span>
              )}
              <span className="hidden sm:inline whitespace-nowrap">{step.label}</span>
            </button>

            {i < steps.length - 1 && (
              <div className={cn(
                'w-3 sm:w-5 h-px mx-0.5 transition-colors duration-200',
                i < currentStep ? 'bg-primary/30' : 'bg-border'
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}
