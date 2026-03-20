import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  const isMobile = useIsMobile();

  return (
    <div className={cn(
      'flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between',
      isMobile ? 'mb-4' : 'mb-6'
    )}>
      <div>
        <h1 className={cn(
          'font-semibold tracking-tight text-foreground',
          isMobile ? 'text-lg' : 'text-2xl'
        )}>{title}</h1>
        {description && (
          <p className={cn(
            'text-muted-foreground',
            isMobile ? 'text-xs mt-0.5' : 'text-sm mt-1'
          )}>{description}</p>
        )}
      </div>
      {action && <div className="mt-2 sm:mt-0">{action}</div>}
    </div>
  );
}
