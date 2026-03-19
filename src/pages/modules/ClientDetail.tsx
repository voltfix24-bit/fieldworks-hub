import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { DetailCard } from '@/components/ui/detail-card';
import { InfoRow } from '@/components/ui/info-row';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { useClient } from '@/hooks/use-clients';
import { ArrowLeft, Pencil, Building2, MapPin, User, FileText } from 'lucide-react';

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: client, isLoading } = useClient(id);

  if (isLoading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (!client) return <p className="text-muted-foreground text-center py-12">Client not found</p>;

  return (
    <div className="animate-fade-in max-w-3xl">
      <div className="mb-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/clients')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Clients
        </Button>
      </div>
      <PageHeader
        title={client.company_name}
        action={
          <div className="flex gap-2">
            <StatusBadge status={client.is_active ? 'active' : 'inactive'} />
            <Button variant="outline" size="sm" onClick={() => navigate(`/clients/${id}/edit`)}>
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DetailCard title="Contact" icon={<User className="h-4 w-4 text-muted-foreground" />}>
          <InfoRow label="Contact Name" value={client.contact_name} />
          <InfoRow label="Email" value={client.email} />
          <InfoRow label="Phone" value={client.phone} />
        </DetailCard>

        <DetailCard title="Address" icon={<MapPin className="h-4 w-4 text-muted-foreground" />}>
          <InfoRow label="Address" value={client.address_line_1} />
          {client.address_line_2 && <InfoRow label="" value={client.address_line_2} />}
          <InfoRow label="City" value={[client.postal_code, client.city].filter(Boolean).join(' ') || null} />
          <InfoRow label="Country" value={client.country} />
        </DetailCard>

        {client.notes && (
          <DetailCard title="Notes" icon={<FileText className="h-4 w-4 text-muted-foreground" />}>
            <p className="text-sm text-foreground whitespace-pre-wrap">{client.notes}</p>
          </DetailCard>
        )}
      </div>
    </div>
  );
}
