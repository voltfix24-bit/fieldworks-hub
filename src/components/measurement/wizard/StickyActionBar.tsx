import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
      'sticky bottom-0 z-20 bg-background/95 backdrop-blur-sm border-t border-border',
      'px-4 py-3 -mx-4 mt-6',
      'flex items-center gap-3',
      showPrev ? 'justify-between' : 'justify-end',
      className
    )}>
      {showPrev && onPrev && (
        <Button variant="ghost" size="sm" onClick={onPrev} className="min-h-[44px] px-4">
          <ChevronLeft className="h-4 w-4 mr-1" /> {prevLabel}
        </Button>
      )}
      {onNext && (
        <Button size="sm" onClick={onNext} disabled={nextDisabled || nextLoading} className="min-h-[44px] px-5">
          {nextLoading ? 'Bezig…' : nextLabel} <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      )}
    </div>
  );
}
