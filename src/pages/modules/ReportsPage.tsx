import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { FileText, Plus } from 'lucide-react';

export default function ReportsPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Reports"
        description="View and generate branded measurement reports"
        action={<Button><Plus className="mr-2 h-4 w-4" /> Generate Report</Button>}
      />
      <EmptyState
        icon={FileText}
        title="No reports yet"
        description="Reports will be generated from completed project measurements with your company branding."
        action={<Button variant="outline"><Plus className="mr-2 h-4 w-4" /> Generate Report</Button>}
      />
    </div>
  );
}
