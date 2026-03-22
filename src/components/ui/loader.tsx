import { cn } from '@/lib/utils';

export function Loader({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const s = size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-10 w-10' : 'h-6 w-6';
  return (
    <div className="flex justify-center items-center py-12">
      <div className={cn(
        s,
        'animate-spin rounded-full',
        'border-2 border-border/30',
        'border-t-[hsl(var(--tenant-primary,var(--primary)))]'
      )} />
    </div>
  );
}
