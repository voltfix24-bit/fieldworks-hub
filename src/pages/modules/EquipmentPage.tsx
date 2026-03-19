import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Wrench, Plus } from 'lucide-react';

export default function EquipmentPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Equipment"
        description="Track measurement instruments and field equipment"
        action={<Button><Plus className="mr-2 h-4 w-4" /> Add Equipment</Button>}
      />
      <EmptyState
        icon={Wrench}
        title="No equipment registered"
        description="Register your measurement instruments and field equipment for tracking and calibration."
        action={<Button variant="outline"><Plus className="mr-2 h-4 w-4" /> Add Equipment</Button>}
      />
    </div>
  );
}
