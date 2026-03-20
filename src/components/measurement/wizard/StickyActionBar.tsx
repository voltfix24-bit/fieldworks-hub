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
  return (
    <div className={cn(
      'sticky bottom-0 z-30',
      'bg-background/90 backdrop-blur-xl',
      'border-t border-border/40',
      '-mx-2 sm:-mx-4',
      'flex items-center gap-2',
      'safe-bottom',
      showPrev ? 'justify-between' : 'justify-end',
      compact ? 'px-3 py-2 mt-3' : 'px-4 py-3 mt-6',
      className
    )}>
      {showPrev && onPrev && (
        <Button
          variant="ghost"
          onClick={onPrev}
          className={cn(
            'font-medium text-muted-foreground hover:text-foreground',
            compact ? 'h-9 px-3 text-[12px]' : 'h-11 px-4 text-[13px]'
          )}
        >
          <ChevronLeft className={cn(compact ? 'h-3.5 w-3.5 mr-0.5' : 'h-4 w-4 mr-1')} />
          {prevLabel}
        </Button>
      )}
      {onNext && (
        <Button
          onClick={onNext}
          disabled={nextDisabled || nextLoading}
          className={cn(
            'font-semibold shadow-sm',
            compact ? 'h-9 px-4 text-[12px] min-w-[100px]' : 'h-11 px-6 text-[13px] min-w-[120px]'
          )}
        >
          {nextLoading && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
          {nextLoading ? 'Bezig…' : nextLabel}
          {!nextLoading && <ChevronRight className={cn(compact ? 'h-3.5 w-3.5 ml-0.5' : 'h-4 w-4 ml-1')} />}
        </Button>
      )}
    </div>
  );
}
