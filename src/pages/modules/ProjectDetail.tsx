import { useNavigate, useParams } from 'react-router-dom';
import { DetailCard } from '@/components/ui/detail-card';
import { InfoRow } from '@/components/ui/info-row';
import { Button } from '@/components/ui/button';
import { useProject, useUpdateProject } from '@/hooks/use-projects';
import { useMeasurementSession } from '@/hooks/use-measurement-sessions';
import { useElectrodes } from '@/hooks/use-electrodes';
import { useAttachments } from '@/hooks/use-attachments';
import { useReportData } from '@/hooks/use-report-data';
import { useToast } from '@/hooks/use-toast';
import { ReadinessChecklist } from '@/components/measurement/ReadinessChecklist';
import { ArrowLeft, Pencil, CheckCircle2, RotateCcw, Users, HardHat, Wrench, FileText, Ruler, ClipboardList, Play, Printer, AlertCircle } from 'lucide-react';

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: project, isLoading, refetch } = useProject(id);
  const updateMut = useUpdateProject();
  const { data: session } = useMeasurementSession(id);
  const { data: electrodes = [] } = useElectrodes(session?.id);
  const { data: attachments = [] } = useAttachments(id);
  const { data: reportData } = useReportData(id);

  if (isLoading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (!project) return <p className="text-muted-foreground text-center py-12">Project not found</p>;

  const client = project.clients as any;
  const tech = project.technicians as any;
  const equip = project.equipment as any;

  const hasSession = !!session;
  const hasElectrodes = electrodes.length > 0;
  const hasClient = !!client;
  const hasTechnician = !!tech;
  const hasEquipment = !!equip;
  const hasMeasurements = (reportData?.stats.measurementCount || 0) > 0;
  const hasSketches = attachments.some((a: any) => a.attachment_type === 'sketch_photo' || a.attachment_type === 'sketch_file');

  const isReportReady = hasSession && hasClient && hasTechnician && hasEquipment && hasElectrodes && hasMeasurements;

  const readinessItems = [
    { label: 'Measurement setup completed', met: hasSession },
    { label: 'Client assigned', met: hasClient },
    { label: 'Technician assigned', met: hasTechnician },
    { label: 'Equipment assigned', met: hasEquipment },
    { label: 'At least one electrode', met: hasElectrodes },
    { label: 'At least one measurement', met: hasMeasurements },
    { label: 'Sketch / photo added', met: hasSketches, optional: true },
  ];

  const handleStatusChange = async (newStatus: 'planned' | 'completed') => {
    if (newStatus === 'completed' && !isReportReady) {
      toast({
        title: 'Cannot mark as completed',
        description: 'Complete all required items before marking the project as completed.',
        variant: 'destructive',
      });
      return;
    }
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
          <Button variant="outline" size="sm" onClick={() => navigate(`/projects/${id}/measurements`)}>
            <Play className="mr-2 h-4 w-4" /> Measurements
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate(`/projects/${id}/report`)}>
            <FileText className="mr-2 h-4 w-4" /> Report
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

      {/* Measurement + Report section */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Measurement summary */}
        <DetailCard
          title="Measurement Setup"
          icon={<Ruler className="h-4 w-4 text-muted-foreground" />}
          action={
            <Button variant="outline" size="sm" onClick={() => navigate(`/projects/${id}/measurements`)}>
              {hasSession ? 'Open Workspace' : 'Start Measurements'}
            </Button>
          }
        >
          {hasSession ? (
            <>
              <InfoRow label="Date" value={session?.measurement_date} />
              <InfoRow label="Electrodes" value={String(electrodes.length)} />
              <InfoRow label="Measurements" value={String(reportData?.stats.measurementCount || 0)} />
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No measurement session yet.</p>
          )}
        </DetailCard>

        {/* Report card */}
        <DetailCard
          title="Report"
          icon={<FileText className="h-4 w-4 text-muted-foreground" />}
          action={
            <div className="flex gap-1">
              <Button variant="outline" size="sm" onClick={() => navigate(`/projects/${id}/report`)}>
                View Report
              </Button>
              {isReportReady && (
                <Button size="sm" onClick={() => { navigate(`/projects/${id}/report`); setTimeout(() => window.print(), 500); }}>
                  <Printer className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          }
        >
          {isReportReady ? (
            <>
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-foreground">Report ready</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {reportData?.stats.electrodeCount} electrodes · {reportData?.stats.measurementCount} measurements · {reportData?.stats.photosCount} photos
              </p>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              <span className="text-sm text-muted-foreground">Complete measurements first</span>
            </div>
          )}
        </DetailCard>

        {/* Readiness */}
        <ReadinessChecklist items={readinessItems} />
      </div>
    </div>
  );
}
