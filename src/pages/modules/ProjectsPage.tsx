import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { ListToolbar } from '@/components/ui/list-toolbar';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProjects, type ProjectWithRelations } from '@/hooks/use-projects';
import { FolderKanban, Plus, Calendar, MapPin, User, Wrench } from 'lucide-react';

export default function ProjectsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { data: projects, isLoading } = useProjects();
  const navigate = useNavigate();

  const filtered = projects?.filter(p => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    return [p.project_number, p.project_name, p.site_name, p.city, p.clients?.company_name]
      .filter(Boolean)
      .some(f => f!.toLowerCase().includes(search.toLowerCase()));
  }) ?? [];

  const StatusLabel = ({ status }: { status: string }) => (
    <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${status === 'completed' ? 'status-completed' : 'status-planned'}`}>
      {status === 'completed' ? 'Completed' : 'Planned'}
    </span>
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Projects"
        description="Manage measurement and inspection projects"
        action={<Button onClick={() => navigate('/projects/new')}><Plus className="mr-2 h-4 w-4" /> New Project</Button>}
      />

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
      ) : projects?.length === 0 ? (
        <EmptyState icon={FolderKanban} title="No projects yet" description="Create your first project to start organizing field work."
          action={<Button variant="outline" onClick={() => navigate('/projects/new')}><Plus className="mr-2 h-4 w-4" /> Create Project</Button>}
        />
      ) : (
        <>
          <ListToolbar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search projects...">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="planned">Planned</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </ListToolbar>

          {/* Desktop */}
          <div className="hidden lg:block">
            <Card>
              <CardContent className="p-0">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Project #</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Name</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Location</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Date</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Client</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Technician</th>
                      <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(p => (
                      <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => navigate(`/projects/${p.id}`)}>
                        <td className="px-4 py-3 text-sm font-mono text-muted-foreground">{p.project_number}</td>
                        <td className="px-4 py-3 text-sm font-medium text-foreground">{p.project_name}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{[p.city, p.country].filter(Boolean).join(', ') || '—'}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{p.planned_date || '—'}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{p.clients?.company_name || '—'}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{p.technicians?.full_name || '—'}</td>
                        <td className="px-4 py-3"><StatusLabel status={p.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>

          {/* Mobile / Tablet */}
          <div className="lg:hidden space-y-3">
            {filtered.map(p => (
              <Card key={p.id} className="cursor-pointer hover:border-primary/30 transition-colors" onClick={() => navigate(`/projects/${p.id}`)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">{p.project_name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{p.project_number}</p>
                    </div>
                    <StatusLabel status={p.status} />
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {p.city && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{p.city}</span>}
                    {p.planned_date && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{p.planned_date}</span>}
                    {p.clients?.company_name && <span className="flex items-center gap-1"><User className="h-3 w-3" />{p.clients.company_name}</span>}
                    {p.technicians?.full_name && <span className="flex items-center gap-1"><User className="h-3 w-3" />{p.technicians.full_name}</span>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filtered.length === 0 && (search || statusFilter !== 'all') && (
            <p className="text-sm text-muted-foreground text-center py-8">No projects match your filters</p>
          )}
        </>
      )}
    </div>
  );
}
