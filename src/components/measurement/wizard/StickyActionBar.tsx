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
}

export function StickyActionBar({
  onPrev, onNext, prevLabel = 'Vorige', nextLabel = 'Volgende',
  nextDisabled, nextLoading, showPrev = true, className
}: StickyActionBarProps) {
  return (
    <div className={cn(
      'sticky bottom-0 z-20',
      'bg-background/80 backdrop-blur-md',
      'border-t border-border/60',
      'px-4 py-3 -mx-1 sm:-mx-4 mt-8',
      'flex items-center gap-3',
      showPrev ? 'justify-between' : 'justify-end',
      className
    )}>
      {showPrev && onPrev && (
        <Button
          variant="ghost"
          onClick={onPrev}
          className="h-11 px-4 text-[13px] font-medium text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4 mr-1.5" />
          {prevLabel}
        </Button>
      )}
      {onNext && (
        <Button
          onClick={onNext}
          disabled={nextDisabled || nextLoading}
          className="h-11 px-6 text-[13px] font-semibold shadow-sm"
        >
          {nextLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : null}
          {nextLoading ? 'Bezig…' : nextLabel}
          {!nextLoading && <ChevronRight className="h-4 w-4 ml-1.5" />}
        </Button>
      )}
    </div>
  );
}
