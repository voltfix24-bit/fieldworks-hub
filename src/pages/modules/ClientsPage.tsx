import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Users, Plus } from 'lucide-react';

export default function ClientsPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Clients"
        description="Manage your client organizations and contacts"
        action={<Button><Plus className="mr-2 h-4 w-4" /> Add Client</Button>}
      />
      <EmptyState
        icon={Users}
        title="No clients yet"
        description="Add your first client to start associating projects with client organizations."
        action={<Button variant="outline"><Plus className="mr-2 h-4 w-4" /> Add Client</Button>}
      />
    </div>
  );
}
