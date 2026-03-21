import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="h-12 w-12 rounded-2xl bg-muted/30 flex items-center justify-center mb-4">
        <Icon className="h-6 w-6 text-muted-foreground/30" />
      </div>
      <h3 className="text-[15px] font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-[13px] text-muted-foreground/50 max-w-sm mb-4">{description}</p>
      {action}
    </div>
  );
}
