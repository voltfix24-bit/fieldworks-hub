import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { formatNlDate } from '@/lib/nl-date';
import { DetailCard } from '@/components/ui/detail-card';
import { InfoRow } from '@/components/ui/info-row';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { useTechnician, useDeleteTechnician } from '@/hooks/use-technicians';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';

export default function TechnicianDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: tech, isLoading } = useTechnician(id);
  const deleteMut = useDeleteTechnician();
  const { toast } = useToast();

  if (isLoading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (!tech) return <p className="text-muted-foreground text-center py-12">Niet gevonden</p>;

  const handleDelete = async () => {
    if (!confirm('Weet u zeker dat u deze monteur wilt verwijderen?')) return;
    try {
      await deleteMut.mutateAsync(tech.id);
      toast({ title: 'Monteur verwijderd' });
      navigate('/technicians');
    } catch (err: any) { toast({ title: 'Fout', description: err.message, variant: 'destructive' }); }
  };

  return (
    <div className="animate-fade-in max-w-2xl">
      <div className="mb-4"><Button variant="ghost" size="sm" onClick={() => navigate('/technicians')}><ArrowLeft className="mr-2 h-4 w-4" /> Terug</Button></div>
      <PageHeader title={tech.full_name} action={
        <div className="flex gap-2">
          <StatusBadge status={tech.is_active ? 'active' : 'inactive'} />
          <Button variant="outline" size="sm" onClick={() => navigate(`/technicians/${id}/edit`)}><Pencil className="mr-2 h-4 w-4" /> Bewerken</Button>
          <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleteMut.isPending}><Trash2 className="mr-2 h-4 w-4" /> Verwijderen</Button>
        </div>
      } />
      <DetailCard title="Gegevens">
        <InfoRow label="Medewerkernummer" value={tech.employee_code} />
        <InfoRow label="E-mail" value={tech.email} />
        <InfoRow label="Telefoon" value={tech.phone} />
        <InfoRow label="Toegevoegd" value={new Date(tech.created_at).toLocaleDateString('nl-NL')} />
      </DetailCard>
    </div>
  );
}
