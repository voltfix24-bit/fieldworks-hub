import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { ListToolbar } from '@/components/ui/list-toolbar';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useTechnicians } from '@/hooks/use-technicians';
import { HardHat, Plus, Mail, Phone } from 'lucide-react';

export default function TechniciansPage() {
  const [search, setSearch] = useState('');
  const { data: technicians, isLoading } = useTechnicians();
  const navigate = useNavigate();

  const filtered = technicians?.filter(t =>
    [t.full_name, t.email, t.employee_code]
      .filter(Boolean)
      .some(f => f!.toLowerCase().includes(search.toLowerCase()))
  ) ?? [];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Technicians"
        description="Manage field technicians and their assignments"
        action={<Button onClick={() => navigate('/technicians/new')}><Plus className="mr-2 h-4 w-4" /> Add Technician</Button>}
      />

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
      ) : technicians?.length === 0 ? (
        <EmptyState icon={HardHat} title="No technicians yet" description="Add technicians to assign them to projects."
          action={<Button variant="outline" onClick={() => navigate('/technicians/new')}><Plus className="mr-2 h-4 w-4" /> Add Technician</Button>}
        />
      ) : (
        <>
          <ListToolbar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search technicians..." />

          <div className="hidden md:block">
            <Card>
              <CardContent className="p-0">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Name</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Code</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Email</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Phone</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(tech => (
                      <tr key={tech.id} className="border-b border-border last:border-0 hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => navigate(`/technicians/${tech.id}`)}>
                        <td className="px-4 py-3 text-sm font-medium text-foreground">{tech.full_name}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground font-mono">{tech.employee_code || '—'}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{tech.email || '—'}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{tech.phone || '—'}</td>
                        <td className="px-4 py-3"><StatusBadge status={tech.is_active ? 'active' : 'inactive'} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>

          <div className="md:hidden space-y-3">
            {filtered.map(tech => (
              <Card key={tech.id} className="cursor-pointer hover:border-primary/30 transition-colors" onClick={() => navigate(`/technicians/${tech.id}`)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <p className="text-sm font-medium text-foreground">{tech.full_name}</p>
                      {tech.employee_code && <p className="text-xs text-muted-foreground font-mono">{tech.employee_code}</p>}
                    </div>
                    <StatusBadge status={tech.is_active ? 'active' : 'inactive'} />
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
                    {tech.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{tech.email}</span>}
                    {tech.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{tech.phone}</span>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filtered.length === 0 && search && <p className="text-sm text-muted-foreground text-center py-8">No technicians match "{search}"</p>}
        </>
      )}
    </div>
  );
}
