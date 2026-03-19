import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { FolderKanban, Plus } from 'lucide-react';

export default function ProjectsPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Projects"
        description="Manage your measurement and inspection projects"
        action={<Button><Plus className="mr-2 h-4 w-4" /> New Project</Button>}
      />
      <EmptyState
        icon={FolderKanban}
        title="No projects yet"
        description="Create your first project to start organizing field measurements and inspections."
        action={<Button variant="outline"><Plus className="mr-2 h-4 w-4" /> Create Project</Button>}
      />
    </div>
  );
}
