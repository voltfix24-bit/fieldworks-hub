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
      <CardContent className={cn(isMobile ? 'p-3.5' : 'p-6')}>
        <div className="flex items-center justify-between">
          <div>
            <p className={cn(
              'font-medium text-muted-foreground',
              isMobile ? 'text-[11px]' : 'text-sm'
            )}>{title}</p>
            <p className={cn(
              'font-bold tracking-tight text-foreground',
              isMobile ? 'text-xl mt-0.5' : 'text-3xl mt-1'
            )}>{value}</p>
            {description && (
              <p className={cn(
                'text-muted-foreground',
                isMobile ? 'text-[10px] mt-0.5' : 'text-xs mt-1'
              )}>{description}</p>
            )}
          </div>
          <div className={cn(
            'rounded-lg bg-muted/60 flex items-center justify-center',
            isMobile ? 'h-9 w-9' : 'h-12 w-12'
          )}>
            <Icon className={cn(
              'text-muted-foreground',
              isMobile ? 'h-4 w-4' : 'h-6 w-6'
            )} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
