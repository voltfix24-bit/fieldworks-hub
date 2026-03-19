import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { DetailCard } from '@/components/ui/detail-card';
import { InfoRow } from '@/components/ui/info-row';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { useTechnician } from '@/hooks/use-technicians';
import { ArrowLeft, Pencil } from 'lucide-react';

export default function TechnicianDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: tech, isLoading } = useTechnician(id);

  if (isLoading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (!tech) return <p className="text-muted-foreground text-center py-12">Not found</p>;

  return (
    <div className="animate-fade-in max-w-2xl">
      <div className="mb-4"><Button variant="ghost" size="sm" onClick={() => navigate('/technicians')}><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button></div>
      <PageHeader title={tech.full_name} action={
        <div className="flex gap-2">
          <StatusBadge status={tech.is_active ? 'active' : 'inactive'} />
          <Button variant="outline" size="sm" onClick={() => navigate(`/technicians/${id}/edit`)}><Pencil className="mr-2 h-4 w-4" /> Edit</Button>
        </div>
      } />
      <DetailCard title="Details">
        <InfoRow label="Employee Code" value={tech.employee_code} />
        <InfoRow label="Email" value={tech.email} />
        <InfoRow label="Phone" value={tech.phone} />
        <InfoRow label="Joined" value={new Date(tech.created_at).toLocaleDateString()} />
      </DetailCard>
    </div>
  );
}
