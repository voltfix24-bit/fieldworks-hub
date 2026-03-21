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
    <div className={cn('flex gap-2 mb-4', isMobile ? 'flex-row items-center' : 'flex-row items-center')}>
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30" />
        <Input
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className={cn('pl-9 border-border/30 bg-card', isMobile && 'h-9 text-[13px]')}
        />
      </div>
      {children && <div className="flex gap-2 shrink-0">{children}</div>}
    </div>
  );
}
