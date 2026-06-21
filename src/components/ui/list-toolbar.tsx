import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface ListToolbarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  children?: React.ReactNode;
}

export function ListToolbar({ searchValue, onSearchChange, searchPlaceholder = 'Zoeken…', children }: ListToolbarProps) {
  const isMobile = useIsMobile();

  return (
    <div
      className={cn(
        'w-full max-w-full min-w-0 mb-4',
        isMobile ? 'flex flex-col gap-2' : 'flex flex-row items-center gap-2',
      )}
    >
      <div className={cn('relative min-w-0', isMobile ? 'w-full' : 'flex-1')}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30" />
        <Input
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className={cn('w-full pl-9 border-border/30 bg-card', isMobile && 'h-9 text-[13px]')}
        />
      </div>
      {children && (
        <div
          className={cn(
            'flex gap-2 min-w-0',
            isMobile ? 'w-full flex-wrap [&>*]:flex-1 [&>*]:min-w-0' : 'shrink-0',
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}
