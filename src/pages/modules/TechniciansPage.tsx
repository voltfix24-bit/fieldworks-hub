import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { HardHat, Plus } from 'lucide-react';

export default function TechniciansPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Technicians"
        description="Manage your field technicians and their assignments"
        action={<Button><Plus className="mr-2 h-4 w-4" /> Add Technician</Button>}
      />
      <EmptyState
        icon={HardHat}
        title="No technicians yet"
        description="Add technicians to assign them to field measurement projects."
        action={<Button variant="outline"><Plus className="mr-2 h-4 w-4" /> Add Technician</Button>}
      />
    </div>
  );
}
