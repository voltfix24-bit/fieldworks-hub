import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { DetailCard } from '@/components/ui/detail-card';
import { InfoRow } from '@/components/ui/info-row';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useProject, useUpdateProject } from '@/hooks/use-projects';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Pencil, CheckCircle2, RotateCcw, MapPin, Users, HardHat, Wrench, FileText, Ruler, Paperclip, ClipboardList, Lock } from 'lucide-react';

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: project, isLoading, refetch } = useProject(id);
  const updateMut = useUpdateProject();

  if (isLoading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (!project) return <p className="text-muted-foreground text-center py-12">Project not found</p>;

  const handleStatusChange = async (newStatus: 'planned' | 'completed') => {
    try {
      await updateMut.mutateAsync({
        id: project.id,
        status: newStatus,
        completed_date: newStatus === 'completed' ? new Date().toISOString().split('T')[0] : null,
      });
      toast({ title: newStatus === 'completed' ? 'Project marked as completed' : 'Project reopened' });
      refetch();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const client = project.clients as any;
  const tech = project.technicians as any;
  const equip = project.equipment as any;

  return (
    <div className="animate-fade-in">
      <div className="mb-4"><Button variant="ghost" size="sm" onClick={() => navigate('/projects')}><ArrowLeft className="mr-2 h-4 w-4" /> Back to Projects</Button></div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">{project.project_name}</h1>
            <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${project.status === 'completed' ? 'status-completed' : 'status-planned'}`}>
              {project.status === 'completed' ? 'Completed' : 'Planned'}
            </span>
          </div>
          <p className="text-sm text-muted-foreground font-mono">{project.project_number}</p>
          {project.site_name && <p className="text-sm text-muted-foreground mt-1">{project.site_name}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(`/projects/${id}/edit`)}>
            <Pencil className="mr-2 h-4 w-4" /> Edit
          </Button>
          {project.status === 'planned' ? (
            <Button size="sm" onClick={() => handleStatusChange('completed')} disabled={updateMut.isPending}>
              <CheckCircle2 className="mr-2 h-4 w-4" /> Mark Completed
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => handleStatusChange('planned')} disabled={updateMut.isPending}>
              <RotateCcw className="mr-2 h-4 w-4" /> Reopen
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Project Summary */}
        <DetailCard title="Project Summary" icon={<ClipboardList className="h-4 w-4 text-muted-foreground" />}>
          <InfoRow label="Planned Date" value={project.planned_date} />
          {project.completed_date && <InfoRow label="Completed" value={project.completed_date} />}
          <InfoRow label="Location" value={[project.address_line_1, project.postal_code, project.city, project.country].filter(Boolean).join(', ') || null} />
        </DetailCard>

        {/* Client */}
        <DetailCard
          title="Client"
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
          action={client && <Button variant="ghost" size="sm" onClick={() => navigate(`/clients/${project.client_id}`)}>View</Button>}
        >
          {client ? (
            <>
              <InfoRow label="Company" value={client.company_name} />
              <InfoRow label="Contact" value={client.contact_name} />
              <InfoRow label="Email" value={client.email} />
              <InfoRow label="Location" value={[client.city, client.country].filter(Boolean).join(', ') || null} />
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No client assigned</p>
          )}
        </DetailCard>

        {/* Technician */}
        <DetailCard
          title="Technician"
          icon={<HardHat className="h-4 w-4 text-muted-foreground" />}
          action={tech && <Button variant="ghost" size="sm" onClick={() => navigate(`/technicians/${project.technician_id}`)}>View</Button>}
        >
          {tech ? (
            <>
              <InfoRow label="Name" value={tech.full_name} />
              <InfoRow label="Code" value={tech.employee_code} />
              <InfoRow label="Email" value={tech.email} />
              <InfoRow label="Phone" value={tech.phone} />
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No technician assigned</p>
          )}
        </DetailCard>

        {/* Equipment */}
        <DetailCard
          title="Equipment"
          icon={<Wrench className="h-4 w-4 text-muted-foreground" />}
          action={equip && <Button variant="ghost" size="sm" onClick={() => navigate(`/equipment/${project.equipment_id}`)}>View</Button>}
        >
          {equip ? (
            <>
              <InfoRow label="Device" value={equip.device_name} />
              <InfoRow label="Brand/Model" value={[equip.brand, equip.model].filter(Boolean).join(' ') || null} />
              <InfoRow label="Serial" value={equip.serial_number} />
              <InfoRow label="Next Cal." value={equip.next_calibration_date} />
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No equipment assigned</p>
          )}
        </DetailCard>
      </div>

      {/* Notes */}
      {project.notes && (
        <DetailCard title="Notes" icon={<FileText className="h-4 w-4 text-muted-foreground" />}>
          <p className="text-sm text-foreground whitespace-pre-wrap">{project.notes}</p>
        </DetailCard>
      )}

      {/* Next Steps / Future Modules */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-foreground mb-4">Workflow Steps</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { title: 'Measurement Setup', description: 'Configure measurement parameters', icon: Ruler },
            { title: 'Measurements', description: 'Enter field measurement data', icon: ClipboardList },
            { title: 'Attachments', description: 'Add sketches and photos', icon: Paperclip },
            { title: 'Report', description: 'Generate branded PDF report', icon: FileText },
          ].map((step, i) => (
            <Card key={step.title} className="border-dashed opacity-60">
              <CardContent className="p-4 flex flex-col items-center text-center">
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center mb-2">
                  <step.icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground mb-0.5">{step.title}</p>
                <p className="text-xs text-muted-foreground">{step.description}</p>
                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                  <Lock className="h-3 w-3" /> Coming soon
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
