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
      'flex items-center w-full',
      compact ? 'gap-0' : 'gap-0 py-2 px-0.5'
    )}>
      {steps.map((step, i) => {
        const isActive = i === currentStep;
        const isCompleted = i < currentStep;
        const isClickable = isCompleted && !!onStepClick;

        return (
          <div key={step.key} className={cn('flex items-center', compact ? 'flex-1' : 'shrink-0')}>
            <button
              type="button"
              disabled={!isClickable}
              onClick={() => isClickable && onStepClick(i)}
              className={cn(
                'flex items-center gap-1 font-medium transition-all duration-150',
                compact
                  ? 'text-[10px] py-0.5 px-0 flex-1 justify-center'
                  : 'text-xs px-3 py-2 rounded-full',
                isActive && (compact
                  ? 'text-[hsl(var(--tenant-primary,var(--primary)))]'
                  : 'bg-primary text-primary-foreground shadow-sm shadow-primary/20'),
                isCompleted && (compact
                  ? 'text-[hsl(var(--tenant-primary,var(--primary))/0.7)]'
                  : 'bg-primary/8 text-primary'),
                !isActive && !isCompleted && 'text-muted-foreground/40',
                isClickable && 'cursor-pointer active:scale-[0.97]',
                !isClickable && !isActive && 'cursor-default'
              )}
            >
              {isCompleted ? (
                <Check className="h-2.5 w-2.5" strokeWidth={3} />
              ) : compact ? null : (
                <span className={cn(
                  'rounded-full flex items-center justify-center font-semibold leading-none w-5 h-5 text-[10px]',
                  isActive ? 'bg-primary-foreground/20' : 'border border-current opacity-50'
                )}>
                  {i + 1}
                </span>
              )}
              <span className="whitespace-nowrap leading-none">{step.label}</span>
            </button>

            {i < steps.length - 1 && (
              <div className={cn(
                'transition-colors duration-200',
                compact
                  ? 'h-px flex-1 max-w-3'
                  : 'h-px w-3 sm:w-5 mx-0.5',
                i < currentStep ? 'bg-[hsl(var(--tenant-primary,var(--primary))/0.3)]' : 'bg-border/50'
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}
