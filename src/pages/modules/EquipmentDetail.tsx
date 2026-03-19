import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { DetailCard } from '@/components/ui/detail-card';
import { InfoRow } from '@/components/ui/info-row';
import { StatusBadge } from '@/components/ui/status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useEquipment, useDeleteEquipment } from '@/hooks/use-equipment';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Pencil, Trash2, Star, AlertTriangle } from 'lucide-react';

export default function EquipmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: eq, isLoading } = useEquipment(id);
  const deleteMut = useDeleteEquipment();
  const { toast } = useToast();

  if (isLoading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (!eq) return <p className="text-muted-foreground text-center py-12">Niet gevonden</p>;

  const calWarning = eq.next_calibration_date && new Date(eq.next_calibration_date) <= new Date(Date.now() + 30 * 86400000);

  const handleDelete = async () => {
    if (!confirm('Weet u zeker dat u dit apparaat wilt verwijderen?')) return;
    try {
      await deleteMut.mutateAsync(eq.id);
      toast({ title: 'Apparaat verwijderd' });
      navigate('/equipment');
    } catch (err: any) { toast({ title: 'Fout', description: err.message, variant: 'destructive' }); }
  };

  return (
    <div className="animate-fade-in max-w-2xl">
      <div className="mb-4"><Button variant="ghost" size="sm" onClick={() => navigate('/equipment')}><ArrowLeft className="mr-2 h-4 w-4" /> Terug</Button></div>
      <PageHeader title={eq.device_name} action={
        <div className="flex items-center gap-2">
          {eq.is_default && <Badge variant="outline" className="border-tenant-primary text-tenant-primary"><Star className="h-3 w-3 mr-1" />Standaard</Badge>}
          <StatusBadge status={eq.is_active ? 'active' : 'inactive'} />
          <Button variant="outline" size="sm" onClick={() => navigate(`/equipment/${id}/edit`)}><Pencil className="mr-2 h-4 w-4" /> Bewerken</Button>
          <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleteMut.isPending}><Trash2 className="mr-2 h-4 w-4" /> Verwijderen</Button>
        </div>
      } />
      <div className="space-y-4">
        <DetailCard title="Apparaatinfo">
          <InfoRow label="Merk" value={eq.brand} />
          <InfoRow label="Model" value={eq.model} />
          <InfoRow label="Serienummer" value={eq.serial_number} />
        </DetailCard>
        <DetailCard title="Kalibratie">
          <InfoRow label="Laatste Kalibratie" value={eq.calibration_date} />
          <div className="flex flex-col sm:flex-row sm:items-center py-3 border-b border-border">
            <span className="text-sm font-medium text-muted-foreground sm:w-40 shrink-0">Volgende Kalibratie</span>
            <span className={`text-sm flex items-center gap-1 ${calWarning ? 'text-destructive font-medium' : 'text-foreground'}`}>
              {calWarning && <AlertTriangle className="h-4 w-4" />}
              {eq.next_calibration_date || '—'}
              {calWarning && <span className="text-xs ml-1">(binnenkort)</span>}
            </span>
          </div>
        </DetailCard>
        {eq.notes && <DetailCard title="Notities"><p className="text-sm text-foreground whitespace-pre-wrap">{eq.notes}</p></DetailCard>}
      </div>
    </div>
  );
}
