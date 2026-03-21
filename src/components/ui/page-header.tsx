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
      isMobile ? 'mb-5' : 'mb-6'
    )}>
      <div>
        <h1 className={cn(
          'font-bold tracking-tight text-foreground',
          isMobile ? 'text-[18px]' : 'text-[22px]'
        )}>{title}</h1>
        {description && (
          <p className={cn(
            'text-muted-foreground/60',
            isMobile ? 'text-[12px] mt-0.5' : 'text-[13px] mt-1'
          )}>{description}</p>
        )}
      </div>
      {action && <div className="mt-2 sm:mt-0">{action}</div>}
    </div>
  );
}
