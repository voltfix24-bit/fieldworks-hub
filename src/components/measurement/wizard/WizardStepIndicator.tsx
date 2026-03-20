import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface WizardStepIndicatorProps {
  steps: { label: string; key: string }[];
  currentStep: number;
  onStepClick?: (stepIndex: number) => void;
  compact?: boolean;
}

export function WizardStepIndicator({ steps, currentStep, onStepClick, compact }: WizardStepIndicatorProps) {
  return (
    <div className={cn(
      'flex items-center gap-0 overflow-x-auto scrollbar-none px-0.5',
      compact ? 'py-1' : 'py-2'
    )}>
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
                'flex items-center gap-1 rounded-full text-xs font-medium transition-all duration-150',
                compact ? 'px-2 py-1.5' : 'px-3 py-2',
                isActive && 'bg-primary text-primary-foreground shadow-sm shadow-primary/20',
                isCompleted && 'bg-primary/8 text-primary',
                !isActive && !isCompleted && 'text-muted-foreground/60',
                isClickable && 'cursor-pointer hover:bg-primary/15 active:scale-[0.97]',
                !isClickable && !isActive && 'cursor-default'
              )}
            >
              {isCompleted ? (
                <Check className={cn(compact ? 'h-3 w-3' : 'h-3.5 w-3.5')} strokeWidth={2.5} />
              ) : (
                <span className={cn(
                  'rounded-full flex items-center justify-center font-semibold leading-none',
                  compact ? 'w-4 h-4 text-[9px]' : 'w-5 h-5 text-[10px]',
                  isActive ? 'bg-primary-foreground/20' : 'border border-current opacity-50'
                )}>
                  {i + 1}
                </span>
              )}
              {/* Always show labels — compact just makes them smaller */}
              <span className={cn(
                'whitespace-nowrap',
                compact ? 'text-[10px]' : 'text-xs'
              )}>{step.label}</span>
            </button>

            {i < steps.length - 1 && (
              <div className={cn(
                'h-px mx-0.5 transition-colors duration-200',
                compact ? 'w-2' : 'w-3 sm:w-5',
                i < currentStep ? 'bg-primary/30' : 'bg-border'
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}
