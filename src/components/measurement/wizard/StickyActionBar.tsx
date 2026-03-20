import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
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
}

export function StickyActionBar({
  onPrev, onNext, prevLabel = 'Vorige', nextLabel = 'Volgende',
  nextDisabled, nextLoading, showPrev = true, className, compact
}: StickyActionBarProps) {
  if (compact) {
    // Mobile: fixed at bottom of fullscreen overlay
    return (
      <div className={cn(
        'shrink-0 border-t border-border/30',
        'bg-background/95 backdrop-blur-lg',
        'flex items-center gap-2 px-3 py-2 safe-bottom',
        showPrev ? 'justify-between' : 'justify-end',
        className
      )}>
        {showPrev && onPrev && (
          <button
            onClick={onPrev}
            className="h-8 flex items-center gap-0.5 px-2 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors active:scale-95 rounded-md"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            {prevLabel}
          </button>
        )}
        {onNext && (
          <Button
            onClick={onNext}
            disabled={nextDisabled || nextLoading}
            size="sm"
            className={cn(
              'h-8 px-4 text-[11px] font-semibold min-w-[90px] shadow-sm',
              'bg-[hsl(var(--tenant-primary,var(--primary)))] hover:bg-[hsl(var(--tenant-primary,var(--primary))/0.9)]',
              'text-white'
            )}
          >
            {nextLoading && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
            {nextLoading ? 'Bezig…' : nextLabel}
            {!nextLoading && <ChevronRight className="h-3 w-3 ml-0.5" />}
          </Button>
        )}
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
