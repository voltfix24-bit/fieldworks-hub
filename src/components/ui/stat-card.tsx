import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
}

export function StatCard({ title, value, icon: Icon, description }: StatCardProps) {
  const isMobile = useIsMobile();

  return (
    <Card className="animate-fade-in">
      <CardContent className={cn(isMobile ? 'p-3.5' : 'p-5')}>
        <div className="flex items-center justify-between">
          <div>
            <p className={cn(
              'font-medium text-muted-foreground/70',
              isMobile ? 'text-[11px]' : 'text-[12px]'
            )}>{title}</p>
            <p className={cn(
              'font-bold tracking-tight text-foreground',
              isMobile ? 'text-xl mt-0.5' : 'text-2xl mt-1'
            )}>{value}</p>
            {description && (
              <p className={cn(
                'text-muted-foreground/50',
                isMobile ? 'text-[10px] mt-0.5' : 'text-[10px] mt-1'
              )}>{description}</p>
            )}
          </div>
          <div className={cn(
            'rounded-xl flex items-center justify-center',
            isMobile ? 'h-9 w-9' : 'h-10 w-10',
            'bg-[hsl(var(--tenant-primary,var(--primary))/0.06)]'
          )}>
            <Icon className={cn(
              'text-[hsl(var(--tenant-primary,var(--primary))/0.4)]',
              isMobile ? 'h-4 w-4' : 'h-5 w-5'
            )} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
