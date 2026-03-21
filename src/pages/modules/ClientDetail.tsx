import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { DetailCard } from '@/components/ui/detail-card';
import { InfoRow } from '@/components/ui/info-row';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { useClient, useDeleteClient } from '@/hooks/use-clients';
import { useClientProjects } from '@/hooks/use-client-projects';
import { useToast } from '@/hooks/use-toast';
import { formatNlDate } from '@/lib/nl-date';
import { ArrowLeft, Pencil, Trash2, Building2, MapPin, User, FileText, FolderKanban, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: client, isLoading } = useClient(id);
  const { data: clientProjects = [] } = useClientProjects(id);
  const deleteMut = useDeleteClient();
  const { toast } = useToast();

  if (isLoading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (!client) return <p className="text-muted-foreground text-center py-12">Klant niet gevonden</p>;

  const handleDelete = async () => {
    if (!confirm('Weet u zeker dat u deze klant wilt verwijderen?')) return;
    try {
      await deleteMut.mutateAsync(client.id);
      toast({ title: 'Klant verwijderd' });
      navigate('/clients');
    } catch (err: any) {
      toast({ title: 'Fout', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <div className="animate-fade-in max-w-3xl">
      <div className="mb-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/clients')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Terug naar Klanten
        </Button>
      </div>
      <PageHeader
        title={client.company_name}
        action={
          <div className="flex gap-2">
            <StatusBadge status={client.is_active ? 'active' : 'inactive'} />
            <Button variant="outline" size="sm" onClick={() => navigate(`/clients/${id}/edit`)}>
              <Pencil className="mr-2 h-4 w-4" /> Bewerken
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleteMut.isPending}>
              <Trash2 className="mr-2 h-4 w-4" /> Verwijderen
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DetailCard title="Contact" icon={<User className="h-4 w-4 text-muted-foreground" />}>
          <InfoRow label="Contactpersoon" value={client.contact_name} />
          <InfoRow label="E-mail" value={client.email} />
          <InfoRow label="Telefoon" value={client.phone} />
        </DetailCard>

        <DetailCard title="Adres" icon={<MapPin className="h-4 w-4 text-muted-foreground" />}>
          <InfoRow label="Adres" value={client.address_line_1} />
          {client.address_line_2 && <InfoRow label="" value={client.address_line_2} />}
          <InfoRow label="Plaats" value={[client.postal_code, client.city].filter(Boolean).join(' ') || null} />
          <InfoRow label="Land" value={client.country} />
        </DetailCard>

        {client.notes && (
          <DetailCard title="Notities" icon={<FileText className="h-4 w-4 text-muted-foreground" />}>
            <p className="text-sm text-foreground whitespace-pre-wrap">{client.notes}</p>
          </DetailCard>
        )}
      </div>

      {/* Projecten sectie */}
      <div className="mt-6">
        <DetailCard
          title={`Projecten (${clientProjects.length})`}
          icon={<FolderKanban className="h-4 w-4 text-muted-foreground" />}
        >
          {clientProjects.length === 0 ? (
            <p className="text-[13px] text-muted-foreground/40 py-4 text-center">Nog geen projecten</p>
          ) : (
            <div className="divide-y divide-border/20 -mx-4">
              {clientProjects.map(p => (
                <button
                  key={p.id}
                  onClick={() => navigate(`/projects/${p.id}`)}
                  className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-foreground/[0.02] transition-colors text-left"
                >
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-foreground truncate">{p.project_name}</p>
                    <p className="text-[11px] text-muted-foreground/40">
                      {p.project_number} · {formatNlDate(p.planned_date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={cn(
                      'w-[6px] h-[6px] rounded-full',
                      p.status === 'completed' ? 'bg-[hsl(var(--status-completed))]' : 'bg-[hsl(var(--status-planned)/0.4)]'
                    )} />
                    <ChevronRight className="h-4 w-4 text-muted-foreground/15" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </DetailCard>
      </div>
    </div>
  );
}
