import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { DetailCard } from '@/components/ui/detail-card';
import { InfoRow } from '@/components/ui/info-row';
import { StatusBadge } from '@/components/ui/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useEquipment } from '@/hooks/use-equipment';
import { ArrowLeft, Pencil, Star, AlertTriangle } from 'lucide-react';

export default function EquipmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: eq, isLoading } = useEquipment(id);

  if (isLoading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (!eq) return <p className="text-muted-foreground text-center py-12">Not found</p>;

  const calWarning = eq.next_calibration_date && new Date(eq.next_calibration_date) <= new Date(Date.now() + 30 * 86400000);

  return (
    <div className="animate-fade-in max-w-2xl">
      <div className="mb-4"><Button variant="ghost" size="sm" onClick={() => navigate('/equipment')}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button></div>
      <PageHeader title={eq.device_name} action={
        <div className="flex items-center gap-2">
          {eq.is_default && <Badge variant="outline" className="border-tenant-primary text-tenant-primary"><Star className="h-3 w-3 mr-1" />Default</Badge>}
          <StatusBadge status={eq.is_active ? 'active' : 'inactive'} />
          <Button variant="outline" size="sm" onClick={() => navigate(`/equipment/${id}/edit`)}><Pencil className="mr-2 h-4 w-4" /> Edit</Button>
        </div>
      } />
      <div className="space-y-4">
        <DetailCard title="Device Info">
          <InfoRow label="Brand" value={eq.brand} />
          <InfoRow label="Model" value={eq.model} />
          <InfoRow label="Serial Number" value={eq.serial_number} />
        </DetailCard>
        <DetailCard title="Calibration">
          <InfoRow label="Last Calibration" value={eq.calibration_date} />
          <div className="flex flex-col sm:flex-row sm:items-center py-3 border-b border-border">
            <span className="text-sm font-medium text-muted-foreground sm:w-40 shrink-0">Next Calibration</span>
            <span className={`text-sm flex items-center gap-1 ${calWarning ? 'text-destructive font-medium' : 'text-foreground'}`}>
              {calWarning && <AlertTriangle className="h-4 w-4" />}
              {eq.next_calibration_date || '—'}
              {calWarning && <span className="text-xs ml-1">(due soon)</span>}
            </span>
          </div>
        </DetailCard>
        {eq.notes && <DetailCard title="Notes"><p className="text-sm text-foreground whitespace-pre-wrap">{eq.notes}</p></DetailCard>}
      </div>
    </div>
  );
}
