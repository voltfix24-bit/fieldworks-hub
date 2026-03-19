import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { FileText, Plus } from 'lucide-react';

export default function ReportsPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Rapporten"
        description="Bekijk en genereer meetrapporten met uw bedrijfshuisstijl"
        action={<Button><Plus className="mr-2 h-4 w-4" /> Rapport Genereren</Button>}
      />
      <EmptyState
        icon={FileText}
        title="Nog geen rapporten"
        description="Rapporten worden gegenereerd op basis van afgeronde projectmetingen met uw bedrijfshuisstijl."
        action={<Button variant="outline"><Plus className="mr-2 h-4 w-4" /> Rapport Genereren</Button>}
      />
    </div>
  );
}
