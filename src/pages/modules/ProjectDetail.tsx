import { useNavigate, useParams } from 'react-router-dom';
import { DetailCard } from '@/components/ui/detail-card';
import { InfoRow } from '@/components/ui/info-row';
import { Button } from '@/components/ui/button';
import { useProject, useUpdateProject, useDeleteProject } from '@/hooks/use-projects';
import { useMeasurementSession } from '@/hooks/use-measurement-sessions';
import { useElectrodes } from '@/hooks/use-electrodes';
import { useAttachments } from '@/hooks/use-attachments';
import { useReportData } from '@/hooks/use-report-data';
import { useToast } from '@/hooks/use-toast';
import { ReadinessChecklist } from '@/components/measurement/ReadinessChecklist';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatNlDate } from '@/lib/nl-date';
import {
  ArrowLeft, Pencil, Trash2, CheckCircle2, RotateCcw,
  Users, HardHat, Wrench, FileText, Ruler, ClipboardList,
  Play, Printer, AlertCircle, ChevronRight
} from 'lucide-react';

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { data: project, isLoading, refetch } = useProject(id);
  const updateMut = useUpdateProject();
  const deleteMut = useDeleteProject();
  const { data: session } = useMeasurementSession(id);
  const { data: electrodes = [] } = useElectrodes(session?.id);
  const { data: attachments = [] } = useAttachments(id);
  const { data: reportData } = useReportData(id);

  if (isLoading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (!project) return <p className="text-muted-foreground text-center py-12">Project niet gevonden</p>;

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
    { label: 'Meetopstelling voltooid', met: hasSession },
    { label: 'Klant toegewezen', met: hasClient },
    { label: 'Monteur toegewezen', met: hasTechnician },
    { label: 'Apparatuur toegewezen', met: hasEquipment },
    { label: 'Minimaal één elektrode', met: hasElectrodes },
    { label: 'Minimaal één meting', met: hasMeasurements },
    { label: 'Schets / foto toegevoegd', met: hasSketches, optional: true },
  ];

  const handleStatusChange = async (newStatus: 'planned' | 'completed') => {
    if (newStatus === 'completed' && !isReportReady) {
      toast({ title: 'Kan niet afronden', description: 'Voltooi eerst alle vereiste onderdelen.', variant: 'destructive' });
      return;
    }
    try {
      await updateMut.mutateAsync({ id: project.id, status: newStatus, completed_date: newStatus === 'completed' ? new Date().toISOString().split('T')[0] : null });
      toast({ title: newStatus === 'completed' ? 'Project afgerond' : 'Project heropend' });
      refetch();
    } catch (err: any) { toast({ title: 'Fout', description: err.message, variant: 'destructive' }); }
  };

  const handleDelete = async () => {
    if (!confirm('Weet u zeker dat u dit project wilt verwijderen?')) return;
    try {
      await deleteMut.mutateAsync(project.id);
      toast({ title: 'Project verwijderd' });
      navigate('/projects');
    } catch (err: any) { toast({ title: 'Fout', description: err.message, variant: 'destructive' }); }
  };

  // ── Mobile-optimised view ──
  if (isMobile) {
    return (
      <div className="animate-fade-in">
        <div className="mb-4">
          <button onClick={() => navigate('/projects')} className="flex items-center gap-1 text-xs text-muted-foreground mb-3 active:scale-97 transition-transform">
            <ArrowLeft className="h-3.5 w-3.5" /> Projecten
          </button>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-lg font-semibold text-foreground leading-snug truncate">{project.project_name}</h1>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">{project.project_number}</p>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium shrink-0 mt-1 ${project.status === 'completed' ? 'status-completed' : 'status-planned'}`}>
              {project.status === 'completed' ? 'Afgerond' : 'Gepland'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 mb-5">
          <button
            onClick={() => navigate(`/projects/${id}/measurements`)}
            className="flex items-center justify-between rounded-xl bg-[hsl(var(--tenant-primary))] text-[hsl(var(--tenant-primary-foreground,0_0%_100%))] px-4 py-3.5 active:scale-[0.97] transition-all"
          >
            <div className="flex items-center gap-2.5">
              <Play className="h-4 w-4" />
              <span className="text-sm font-medium">{hasSession ? 'Metingen' : 'Meten starten'}</span>
            </div>
            <ChevronRight className="h-4 w-4 opacity-60" />
          </button>
          <button
            onClick={() => navigate(`/projects/${id}/report`)}
            className="flex items-center justify-between rounded-xl bg-muted/60 text-foreground px-4 py-3.5 active:scale-[0.97] transition-all"
          >
            <div className="flex items-center gap-2.5">
              <FileText className="h-4 w-4" />
              <span className="text-sm font-medium">Rapport</span>
            </div>
            <ChevronRight className="h-4 w-4 opacity-40" />
          </button>
        </div>

        <div className="rounded-xl bg-card border border-border/40 divide-y divide-border/40 mb-5">
          <MobileInfoRow label="Locatie" value={[project.address_line_1, project.city].filter(Boolean).join(', ')} />
          <MobileInfoRow label="Klant" value={client?.company_name} />
          <MobileInfoRow label="Monteur" value={tech?.full_name} />
          <MobileInfoRow label="Apparaat" value={equip?.device_name} />
          <MobileInfoRow label="Datum" value={formatNlDate(project.planned_date)} />
        </div>

        {hasSession && (
          <div className="rounded-xl bg-card border border-border/40 p-4 mb-5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2.5">Voortgang</p>
            <div className="grid grid-cols-3 gap-3">
              <MobileStat label="Elektrodes" value={electrodes.length} />
              <MobileStat label="Metingen" value={reportData?.stats.measurementCount || 0} />
              <MobileStat label="Foto's" value={reportData?.stats.photosCount || 0} />
            </div>
          </div>
        )}

        <ReadinessChecklist items={readinessItems} />

        <div className="mt-5 flex flex-col gap-2">
          <Button variant="outline" size="sm" className="justify-start" onClick={() => navigate(`/projects/${id}/edit`)}>
            <Pencil className="mr-2 h-3.5 w-3.5" /> Bewerken
          </Button>
          {project.status === 'planned' ? (
            <Button size="sm" className="justify-start" onClick={() => handleStatusChange('completed')} disabled={updateMut.isPending || !isReportReady}>
              <CheckCircle2 className="mr-2 h-3.5 w-3.5" /> Project afronden
            </Button>
          ) : (
            <Button variant="outline" size="sm" className="justify-start" onClick={() => handleStatusChange('planned')} disabled={updateMut.isPending}>
              <RotateCcw className="mr-2 h-3.5 w-3.5" /> Heropenen
            </Button>
          )}
          <Button variant="ghost" size="sm" className="justify-start text-destructive hover:text-destructive" onClick={handleDelete} disabled={deleteMut.isPending}>
            <Trash2 className="mr-2 h-3.5 w-3.5" /> Verwijderen
          </Button>
        </div>
      </div>
    );
  }

  // ── Desktop view ──
  return (
    <div className="animate-fade-in">
      <div className="mb-4"><Button variant="ghost" size="sm" onClick={() => navigate('/projects')}><ArrowLeft className="mr-2 h-4 w-4" /> Terug naar Projecten</Button></div>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">{project.project_name}</h1>
            <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${project.status === 'completed' ? 'status-completed' : 'status-planned'}`}>
              {project.status === 'completed' ? 'Afgerond' : 'Gepland'}
            </span>
          </div>
          <p className="text-sm text-muted-foreground font-mono">{project.project_number}</p>
          {project.site_name && <p className="text-sm text-muted-foreground mt-1">{project.site_name}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(`/projects/${id}/edit`)}><Pencil className="mr-2 h-4 w-4" /> Bewerken</Button>
          <Button variant="outline" size="sm" onClick={() => navigate(`/projects/${id}/measurements`)}><Play className="mr-2 h-4 w-4" /> Metingen</Button>
          <Button variant="outline" size="sm" onClick={() => navigate(`/projects/${id}/report`)}><FileText className="mr-2 h-4 w-4" /> Rapport</Button>
          {project.status === 'planned' ? (
            <Button size="sm" onClick={() => handleStatusChange('completed')} disabled={updateMut.isPending}><CheckCircle2 className="mr-2 h-4 w-4" /> Afronden</Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => handleStatusChange('planned')} disabled={updateMut.isPending}><RotateCcw className="mr-2 h-4 w-4" /> Heropenen</Button>
          )}
          <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleteMut.isPending}><Trash2 className="mr-2 h-4 w-4" /> Verwijderen</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <DetailCard title="Projectoverzicht" icon={<ClipboardList className="h-4 w-4 text-muted-foreground" />}>
          <InfoRow label="Geplande datum" value={formatNlDate(project.planned_date)} />
          {project.completed_date && <InfoRow label="Afgerond" value={formatNlDate(project.completed_date)} />}
          <InfoRow label="Locatie" value={[project.address_line_1, project.postal_code, project.city, project.country].filter(Boolean).join(', ') || null} />
        </DetailCard>
        <DetailCard title="Klant" icon={<Users className="h-4 w-4 text-muted-foreground" />}
          action={client && <Button variant="ghost" size="sm" onClick={() => navigate(`/clients/${project.client_id}`)}>Bekijk</Button>}>
          {client ? (<><InfoRow label="Bedrijf" value={client.company_name} /><InfoRow label="Contact" value={client.contact_name} /><InfoRow label="E-mail" value={client.email} /></>) : <p className="text-sm text-muted-foreground">Geen klant toegewezen</p>}
        </DetailCard>
        <DetailCard title="Monteur" icon={<HardHat className="h-4 w-4 text-muted-foreground" />}
          action={tech && <Button variant="ghost" size="sm" onClick={() => navigate(`/technicians/${project.technician_id}`)}>Bekijk</Button>}>
          {tech ? (<><InfoRow label="Naam" value={tech.full_name} /><InfoRow label="Code" value={tech.employee_code} /><InfoRow label="E-mail" value={tech.email} /></>) : <p className="text-sm text-muted-foreground">Geen monteur toegewezen</p>}
        </DetailCard>
        <DetailCard title="Apparatuur" icon={<Wrench className="h-4 w-4 text-muted-foreground" />}
          action={equip && <Button variant="ghost" size="sm" onClick={() => navigate(`/equipment/${project.equipment_id}`)}>Bekijk</Button>}>
          {equip ? (<><InfoRow label="Apparaat" value={equip.device_name} /><InfoRow label="Merk/Model" value={[equip.brand, equip.model].filter(Boolean).join(' ') || null} /><InfoRow label="Serienummer" value={equip.serial_number} /></>) : <p className="text-sm text-muted-foreground">Geen apparatuur toegewezen</p>}
        </DetailCard>
      </div>

      {project.notes && (
        <DetailCard title="Notities" icon={<FileText className="h-4 w-4 text-muted-foreground" />}>
          <p className="text-sm text-foreground whitespace-pre-wrap">{project.notes}</p>
        </DetailCard>
      )}

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <DetailCard title="Meetopstelling" icon={<Ruler className="h-4 w-4 text-muted-foreground" />}
          action={<Button variant="outline" size="sm" onClick={() => navigate(`/projects/${id}/measurements`)}>{hasSession ? 'Werkruimte openen' : 'Metingen starten'}</Button>}>
          {hasSession ? (<><InfoRow label="Datum" value={formatNlDate(session?.measurement_date)} /><InfoRow label="Elektrodes" value={String(electrodes.length)} /><InfoRow label="Metingen" value={String(reportData?.stats.measurementCount || 0)} /></>) : <p className="text-sm text-muted-foreground">Nog geen meetsessie.</p>}
        </DetailCard>
        <DetailCard title="Rapport" icon={<FileText className="h-4 w-4 text-muted-foreground" />}
          action={<div className="flex gap-1">
            <Button variant="outline" size="sm" onClick={() => navigate(`/projects/${id}/report`)}>Bekijk rapport</Button>
            {isReportReady && <Button size="sm" onClick={() => { navigate(`/projects/${id}/report`); setTimeout(() => window.print(), 500); }}><Printer className="h-3.5 w-3.5" /></Button>}
          </div>}>
          {isReportReady ? (<><div className="flex items-center gap-2 mb-2"><CheckCircle2 className="h-4 w-4 text-green-600" /><span className="text-sm font-medium text-foreground">Rapport gereed</span></div><p className="text-xs text-muted-foreground">{reportData?.stats.electrodeCount} elektrodes · {reportData?.stats.measurementCount} metingen · {reportData?.stats.photosCount} foto's</p></>) : (
            <div className="flex items-center gap-2"><AlertCircle className="h-4 w-4 text-orange-500" /><span className="text-sm text-muted-foreground">Voltooi eerst de metingen</span></div>
          )}
        </DetailCard>
        <ReadinessChecklist items={readinessItems} />
      </div>
    </div>
  );
}

function MobileInfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm text-foreground font-medium truncate ml-4 text-right">{value || '—'}</span>
    </div>
  );
}

function MobileStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <p className="text-lg font-semibold text-foreground tabular-nums">{value}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}
