import { Badge } from '@/components/ui/badge';

type Status = 'planned' | 'in_progress' | 'completed' | 'archived' | 'active' | 'inactive' | 'suspended' | 'invited';

const statusConfig: Record<Status, { label: string; className: string }> = {
  planned: { label: 'Gepland', className: 'status-planned' },
  in_progress: { label: 'In uitvoering', className: 'status-in-progress' },
  completed: { label: 'Afgerond', className: 'status-completed' },
  archived: { label: 'Gearchiveerd', className: 'status-archived' },
  active: { label: 'Actief', className: 'status-completed' },
  inactive: { label: 'Inactief', className: 'status-archived' },
  suspended: { label: 'Opgeschort', className: 'status-planned' },
  invited: { label: 'Uitgenodigd', className: 'status-in-progress' },
};

export function StatusBadge({ status }: { status: Status }) {
  const config = statusConfig[status] || statusConfig.planned;
  return (
    <Badge variant="outline" className={`${config.className} border-0 font-medium`}>
      {config.label}
    </Badge>
  );
}
