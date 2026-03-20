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
      <div className={cn(
        'shrink-0 border-t border-border/30',
        'bg-background/95 backdrop-blur-lg',
        'safe-bottom',
        className
      )}>
        {warningMessage && (
          <div className="flex items-start gap-2 px-3 py-2 bg-amber-500/5 border-b border-amber-500/15">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold leading-snug">{warningMessage}</p>
              <p className="text-[9px] text-amber-600/60 dark:text-amber-500/60 mt-0.5">Controleer de gemarkeerde waarden</p>
            </div>
            {onConfirmWarning && (
              <button
                onClick={onConfirmWarning}
                className="text-[10px] font-bold text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded hover:bg-amber-500/10 transition-colors shrink-0"
              >
                Toch doorgaan
              </button>
            )}
          </div>
        )}
        <div className={cn(
          'flex items-center gap-2 px-3 py-2',
          showPrev ? 'justify-between' : 'justify-end',
        )}>
          {showPrev && onPrev && (
            <button
              onClick={onPrev}
              className="h-9 flex items-center gap-0.5 px-2 text-[12px] font-semibold text-muted-foreground hover:text-foreground transition-colors active:scale-95 rounded-md"
            >
              <ChevronLeft className="h-4 w-4" />
              {prevLabel}
            </button>
          )}
          {onNext && (
            <Button
              onClick={onNext}
              disabled={nextDisabled || nextLoading}
              size="sm"
              className={cn(
                'h-9 px-5 text-[12px] font-bold min-w-[100px] shadow-sm',
                'bg-[hsl(var(--tenant-primary,var(--primary)))] hover:bg-[hsl(var(--tenant-primary,var(--primary))/0.9)]',
                'text-white'
              )}
            >
              {nextLoading && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
              {nextLoading ? 'Bezig…' : nextLabel}
              {!nextLoading && <ChevronRight className="h-3.5 w-3.5 ml-0.5" />}
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Desktop
  return (
    <div className={cn(
      'sticky bottom-0 z-30',
      'bg-background/90 backdrop-blur-xl',
      'border-t border-border/40',
      '-mx-2 sm:-mx-4',
      'flex items-center gap-2 px-4 py-3 mt-6',
      showPrev ? 'justify-between' : 'justify-end',
      className
    )}>
      {showPrev && onPrev && (
        <Button
          variant="ghost"
          onClick={onPrev}
          className="h-11 px-4 text-[13px] font-medium text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          {prevLabel}
        </Button>
      )}
      {onNext && (
        <Button
          onClick={onNext}
          disabled={nextDisabled || nextLoading}
          className="h-11 px-6 text-[13px] font-semibold shadow-sm min-w-[120px]"
        >
          {nextLoading && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
          {nextLoading ? 'Bezig…' : nextLabel}
          {!nextLoading && <ChevronRight className="h-4 w-4 ml-1" />}
        </Button>
      )}
    </div>
  );
}
