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
    <div className={cn('flex items-center w-full', compact ? 'gap-0' : 'gap-0 py-2 px-0.5')}>
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
                  ? 'text-[12px] py-1 px-0 flex-1 justify-center'
                  : 'text-[12px] px-3 py-2 rounded-full',
                isActive && 'text-foreground font-semibold',
                isCompleted && 'text-[hsl(var(--tenant-primary)/0.6)]',
                !isActive && !isCompleted && 'text-muted-foreground/30',
                isClickable && 'cursor-pointer active:scale-[0.97]',
                !isClickable && !isActive && 'cursor-default'
              )}
            >
              {isCompleted ? (
                <Check className="h-3 w-3" strokeWidth={2.5} />
              ) : compact ? null : (
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
                'transition-colors duration-200',
                compact ? 'h-px flex-1 max-w-4' : 'h-px w-4 mx-0.5',
                i < currentStep ? 'bg-[hsl(var(--tenant-primary)/0.2)]' : 'bg-border/30'
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}
