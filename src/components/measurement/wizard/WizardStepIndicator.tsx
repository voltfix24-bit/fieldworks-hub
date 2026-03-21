import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface WizardStepIndicatorProps {
  steps: { label: string; key: string }[];
  currentStep: number;
  onStepClick?: (stepIndex: number) => void;
  compact?: boolean;
}

export function WizardStepIndicator({ steps, currentStep, onStepClick, compact }: WizardStepIndicatorProps) {
  if (compact) {
    return (
      <div className="flex items-center w-full rounded-xl bg-foreground/[0.04] p-0.5">
        {steps.map((step, i) => {
          const isActive = i === currentStep;
          const isCompleted = i < currentStep;
          const isClickable = isCompleted && !!onStepClick;

          return (
            <button
              key={step.key}
              type="button"
              disabled={!isClickable && !isActive}
              onClick={() => isClickable && onStepClick(i)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1 py-[7px] rounded-[10px] text-[12px] font-medium transition-all duration-200',
                isActive && 'bg-card shadow-sm text-foreground font-semibold',
                isCompleted && !isActive && 'text-[hsl(var(--tenant-primary)/0.6)]',
                !isActive && !isCompleted && 'text-muted-foreground/30',
                isClickable && 'cursor-pointer active:scale-[0.97]',
                isCompleted && 'transition-all duration-300',
              )}
            >
              {isCompleted && <Check className="h-3 w-3 animate-in zoom-in-50 duration-200" strokeWidth={2.5} />}
              <span className="whitespace-nowrap leading-none">{step.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // Desktop
  return (
    <div className="flex items-center w-full gap-0 py-2 px-0.5">
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
                'flex items-center gap-1 font-medium transition-all duration-150',
                'text-[12px] px-3 py-2 rounded-full',
                isActive && 'text-foreground font-semibold',
                isCompleted && 'text-[hsl(var(--tenant-primary)/0.6)] transition-all duration-300',
                !isActive && !isCompleted && 'text-muted-foreground/30',
                isClickable && 'cursor-pointer active:scale-[0.97]',
                !isClickable && !isActive && 'cursor-default'
              )}
            >
              {isCompleted ? (
                <Check className="h-3 w-3 animate-in zoom-in-50 duration-200" strokeWidth={2.5} />
              ) : (
                <span className={cn(
                  'rounded-full flex items-center justify-center font-semibold leading-none w-5 h-5 text-[10px]',
                  isActive ? 'bg-foreground/10' : 'border border-current opacity-40'
                )}>
                  {i + 1}
                </span>
              )}
              <span className="whitespace-nowrap leading-none">{step.label}</span>
            </button>
            {i < steps.length - 1 && (
              <div className={cn(
                'h-px w-4 mx-0.5 transition-colors duration-200',
                i < currentStep ? 'bg-[hsl(var(--tenant-primary)/0.2)]' : 'bg-border/30'
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}
