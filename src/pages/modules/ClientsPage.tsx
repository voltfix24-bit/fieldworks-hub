import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { ListToolbar } from '@/components/ui/list-toolbar';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useClients } from '@/hooks/use-clients';
import { Users, Plus, Mail, Phone, MapPin } from 'lucide-react';

export default function ClientsPage() {
  const [search, setSearch] = useState('');
  const { data: clients, isLoading } = useClients();
  const navigate = useNavigate();

  const filtered = clients?.filter(c =>
    [c.company_name, c.contact_name, c.email, c.city]
      .filter(Boolean)
      .some(f => f!.toLowerCase().includes(search.toLowerCase()))
  ) ?? [];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Clients"
        description="Manage your client organizations and contacts"
        action={<Button onClick={() => navigate('/clients/new')}><Plus className="mr-2 h-4 w-4" /> Add Client</Button>}
      />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : clients?.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No clients yet"
          description="Add your first client to start associating projects with organizations."
          action={<Button variant="outline" onClick={() => navigate('/clients/new')}><Plus className="mr-2 h-4 w-4" /> Add Client</Button>}
        />
      ) : (
        <>
          <ListToolbar
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search clients..."
          />

          {/* Desktop table */}
          <div className="hidden md:block">
            <Card>
              <CardContent className="p-0">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Company</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Contact</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">City</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Email</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Phone</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(client => (
                      <tr
                        key={client.id}
                        className="border-b border-border last:border-0 hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => navigate(`/clients/${client.id}`)}
                      >
                        <td className="px-4 py-3 text-sm font-medium text-foreground">{client.company_name}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{client.contact_name || '—'}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{client.city || '—'}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{client.email || '—'}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{client.phone || '—'}</td>
                        <td className="px-4 py-3"><StatusBadge status={client.is_active ? 'active' : 'inactive'} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map(client => (
              <Card
                key={client.id}
                className="cursor-pointer hover:border-primary/30 transition-colors"
                onClick={() => navigate(`/clients/${client.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">{client.company_name}</p>
                      {client.contact_name && (
                        <p className="text-xs text-muted-foreground">{client.contact_name}</p>
                      )}
                    </div>
                    <StatusBadge status={client.is_active ? 'active' : 'inactive'} />
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {client.city && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{client.city}</span>}
                    {client.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{client.email}</span>}
                    {client.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{client.phone}</span>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filtered.length === 0 && search && (
            <p className="text-sm text-muted-foreground text-center py-8">No clients match "{search}"</p>
          )}
        </>
      )}
    </div>
  );
}
