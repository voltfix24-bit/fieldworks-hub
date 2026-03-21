import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Loader2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StickyActionBarProps {
  onPrev?: () => void;
  onNext?: () => void;
  prevLabel?: string;
  nextLabel?: string;
  nextDisabled?: boolean;
  nextLoading?: boolean;
  showPrev?: boolean;
  className?: string;
  compact?: boolean;
  warningMessage?: string;
  onConfirmWarning?: () => void;
}

export function StickyActionBar({
  onPrev, onNext, prevLabel = 'Vorige', nextLabel = 'Volgende',
  nextDisabled, nextLoading, showPrev = true, className, compact,
  warningMessage, onConfirmWarning
}: StickyActionBarProps) {
  if (compact) {
    return (
      <div className={cn('shrink-0 pb-[max(10px,env(safe-area-inset-bottom))]', className)}>
        {warningMessage && (
          <div className="flex items-start gap-2 px-4 py-2.5 bg-amber-500/[0.04]">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500/70 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium leading-snug">{warningMessage}</p>
            </div>
            {onConfirmWarning && (
              <button onClick={onConfirmWarning} className="text-[11px] font-semibold text-amber-600 px-2 py-0.5 rounded-lg active:bg-amber-500/10 transition-colors shrink-0">
                Doorgaan
              </button>
            )}
          </div>
        )}
        <div className={cn(
          'flex items-center gap-2 px-4 py-2.5',
          'glass-surface border-t-0 border-x-0 rounded-none',
          showPrev ? 'justify-between' : 'justify-end',
        )}>
          {showPrev && onPrev && (
            <button onClick={onPrev} className="h-10 flex items-center gap-0.5 px-2 text-[13px] font-medium text-muted-foreground active:opacity-60 transition-opacity rounded-lg">
              <ChevronLeft className="h-4 w-4" />
              {prevLabel}
            </button>
          )}
          {onNext && (
            <button
              onClick={onNext}
              disabled={nextDisabled || nextLoading}
              className={cn(
                'h-10 px-6 rounded-xl text-[13px] font-semibold min-w-[100px]',
                'bg-[hsl(var(--tenant-primary))] text-white',
                'active:scale-[0.96] transition-all disabled:opacity-40',
              )}
            >
              {nextLoading && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin inline" />}
              {nextLoading ? 'Bezig…' : nextLabel}
              {!nextLoading && <ChevronRight className="h-3.5 w-3.5 ml-0.5 inline" />}
            </button>
          )}
        </div>
      </div>
    );
  }

  // Desktop
  return (
    <div className={cn(
      'sticky bottom-0 z-30 bg-card/80 backdrop-blur-xl',
      'border-t border-border/20 -mx-2 sm:-mx-4',
      'flex items-center gap-2 px-4 py-3 mt-6',
      showPrev ? 'justify-between' : 'justify-end',
      className
    )}>
      {showPrev && onPrev && (
        <Button variant="ghost" onClick={onPrev} className="h-10 px-4 text-[13px] font-medium text-muted-foreground rounded-xl">
          <ChevronLeft className="h-4 w-4 mr-1" /> {prevLabel}
        </Button>
      )}
      {onNext && (
        <Button onClick={onNext} disabled={nextDisabled || nextLoading} className="h-10 px-6 text-[13px] font-semibold min-w-[120px] rounded-xl">
          {nextLoading && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
          {nextLoading ? 'Bezig…' : nextLabel}
          {!nextLoading && <ChevronRight className="h-4 w-4 ml-1" />}
        </Button>
      )}
    </div>
  );
}
