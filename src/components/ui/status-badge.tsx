import { Badge } from '@/components/ui/badge';

type Status = 'planned' | 'in_progress' | 'completed' | 'archived' | 'active' | 'inactive' | 'suspended' | 'invited';

const statusConfig: Record<Status, { label: string; className: string }> = {
  planned: { label: 'Planned', className: 'status-planned' },
  in_progress: { label: 'In Progress', className: 'status-in-progress' },
  completed: { label: 'Completed', className: 'status-completed' },
  archived: { label: 'Archived', className: 'status-archived' },
  active: { label: 'Active', className: 'status-completed' },
  inactive: { label: 'Inactive', className: 'status-archived' },
  suspended: { label: 'Suspended', className: 'status-planned' },
  invited: { label: 'Invited', className: 'status-in-progress' },
};

export function StatusBadge({ status }: { status: Status }) {
  const config = statusConfig[status] || statusConfig.planned;
  return (
    <Badge variant="outline" className={`${config.className} border-0 font-medium`}>
      {config.label}
    </Badge>
  );
}
