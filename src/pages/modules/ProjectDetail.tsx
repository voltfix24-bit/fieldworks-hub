import { useNavigate, useParams } from 'react-router-dom';
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
import { GroundingIcon } from '@/components/measurement/GroundingIcon';
import { cn } from '@/lib/utils';
import {
  ArrowLeft, Pencil, Trash2, CheckCircle2, RotateCcw,
  FileText, Play, Printer, AlertCircle, ChevronRight
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

  if (isLoading) return <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>;
  if (!project) return <p className="text-muted-foreground/40 text-center py-16">Project niet gevonden</p>;

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

  // ── Mobile ──
  if (isMobile) {
    return (
      <div className="animate-fade-in space-y-4">
        {/* Header */}
        <div>
          <button onClick={() => navigate('/projects')} className="flex items-center gap-1 text-[13px] text-muted-foreground/50 mb-3 active:opacity-60 transition-opacity">
            <ArrowLeft className="h-4 w-4" /> Projecten
          </button>
          <h1 className="text-[22px] font-bold text-foreground tracking-tight leading-snug">{project.project_name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[12px] text-muted-foreground/35 font-mono">{project.project_number}</span>
            <StatusIndicator status={project.status} />
          </div>
        </div>

        {/* Primary CTA */}
        <button
          onClick={() => navigate(`/projects/${id}/measurements`)}
          className="w-full flex items-center justify-between rounded-2xl bg-[hsl(var(--tenant-primary))] text-white px-5 py-4 active:scale-[0.97] transition-all shadow-[0_2px_16px_-4px_hsl(var(--tenant-primary)/0.3)]"
        >
          <div className="flex items-center gap-3">
            <GroundingIcon size={20} />
            <div>
              <span className="text-[15px] font-bold block leading-snug">{hasSession ? 'Metingen' : 'Meten starten'}</span>
              {hasSession && hasMeasurements && (
                <span className="text-[11px] opacity-70">{electrodes.length} elektrodes · {reportData?.stats.measurementCount} metingen</span>
              )}
            </div>
          </div>
          <ChevronRight className="h-5 w-5 opacity-40" />
        </button>

        {/* Secondary actions */}
        <div className="flex gap-2">
          <SecondaryAction icon={FileText} label="Rapport" onClick={() => navigate(`/projects/${id}/report`)} />
          <SecondaryAction icon={Pencil} label="Bewerken" onClick={() => navigate(`/projects/${id}/edit`)} />
        </div>

        {/* Project info */}
        <section>
          <SectionLabel>Projectgegevens</SectionLabel>
          <div className="ios-group overflow-hidden divide-y divide-border/15">
            <InfoLine label="Locatie" value={[project.address_line_1, project.city].filter(Boolean).join(', ')} />
            <InfoLine label="Klant" value={client?.company_name} />
            <InfoLine label="Monteur" value={tech?.full_name} />
            <InfoLine label="Apparaat" value={equip?.device_name} />
            <InfoLine label="Datum" value={formatNlDate(project.planned_date)} />
          </div>
        </section>

        {/* Progress */}
        {hasSession && (
          <section>
            <SectionLabel>Voortgang</SectionLabel>
            <div className="flex items-center gap-8 px-1">
              <ProgressStat label="Elektrodes" value={electrodes.length} />
              <ProgressStat label="Metingen" value={reportData?.stats.measurementCount || 0} />
              <ProgressStat label="Foto's" value={reportData?.stats.photosCount || 0} />
            </div>
          </section>
        )}

        <ReadinessChecklist items={readinessItems} />

        {/* Status actions */}
        <div className="space-y-2 pt-2">
          {project.status === 'planned' ? (
            <button
              onClick={() => handleStatusChange('completed')}
              disabled={updateMut.isPending || !isReportReady}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-[hsl(var(--status-completed)/0.06)] text-[hsl(var(--status-completed))] active:scale-[0.98] transition-all disabled:opacity-30"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-[14px] font-semibold">Project afronden</span>
            </button>
          ) : (
            <button
              onClick={() => handleStatusChange('planned')}
              disabled={updateMut.isPending}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-foreground/[0.03] text-foreground active:scale-[0.98] transition-all disabled:opacity-30"
            >
              <RotateCcw className="h-4 w-4 text-muted-foreground" />
              <span className="text-[14px] font-medium">Heropenen</span>
            </button>
          )}
          <button
            onClick={handleDelete}
            disabled={deleteMut.isPending}
            className="w-full text-center py-2 text-[12px] text-destructive/40 font-medium active:opacity-60 transition-opacity disabled:opacity-20"
          >
            Verwijderen
          </button>
        </div>
      </div>
    );
  }

  // ── Desktop ──
  return (
    <div className="animate-fade-in max-w-4xl">
      <div className="mb-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/projects')}><ArrowLeft className="mr-2 h-4 w-4" /> Projecten</Button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{project.project_name}</h1>
            <StatusIndicator status={project.status} />
          </div>
          <p className="text-sm text-muted-foreground/50 font-mono">{project.project_number}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="rounded-xl" onClick={() => navigate(`/projects/${id}/edit`)}><Pencil className="mr-2 h-3.5 w-3.5" /> Bewerken</Button>
          <Button size="sm" className="rounded-xl" onClick={() => navigate(`/projects/${id}/measurements`)}><Play className="mr-2 h-3.5 w-3.5" /> Metingen</Button>
          <Button variant="outline" size="sm" className="rounded-xl" onClick={() => navigate(`/projects/${id}/report`)}><FileText className="mr-2 h-3.5 w-3.5" /> Rapport</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <DesktopSection title="Projectoverzicht">
          <DesktopInfoRow label="Geplande datum" value={formatNlDate(project.planned_date)} />
          {project.completed_date && <DesktopInfoRow label="Afgerond" value={formatNlDate(project.completed_date)} />}
          <DesktopInfoRow label="Locatie" value={[project.address_line_1, project.postal_code, project.city].filter(Boolean).join(', ') || null} />
        </DesktopSection>
        <DesktopSection title="Klant" action={client && <Button variant="ghost" size="sm" className="rounded-lg" onClick={() => navigate(`/clients/${project.client_id}`)}>Bekijk</Button>}>
          {client ? (<><DesktopInfoRow label="Bedrijf" value={client.company_name} /><DesktopInfoRow label="Contact" value={client.contact_name} /></>) : <p className="text-sm text-muted-foreground/40">Geen klant toegewezen</p>}
        </DesktopSection>
        <DesktopSection title="Monteur" action={tech && <Button variant="ghost" size="sm" className="rounded-lg" onClick={() => navigate(`/technicians/${project.technician_id}`)}>Bekijk</Button>}>
          {tech ? (<><DesktopInfoRow label="Naam" value={tech.full_name} /><DesktopInfoRow label="Code" value={tech.employee_code} /></>) : <p className="text-sm text-muted-foreground/40">Geen monteur toegewezen</p>}
        </DesktopSection>
        <DesktopSection title="Apparatuur" action={equip && <Button variant="ghost" size="sm" className="rounded-lg" onClick={() => navigate(`/equipment/${project.equipment_id}`)}>Bekijk</Button>}>
          {equip ? (<><DesktopInfoRow label="Apparaat" value={equip.device_name} /><DesktopInfoRow label="Merk/Model" value={[equip.brand, equip.model].filter(Boolean).join(' ') || null} /></>) : <p className="text-sm text-muted-foreground/40">Geen apparatuur toegewezen</p>}
        </DesktopSection>
      </div>

      {project.notes && (
        <DesktopSection title="Notities">
          <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">{project.notes}</p>
        </DesktopSection>
      )}

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <DesktopSection title="Meetopstelling" action={
          <Button variant="outline" size="sm" className="rounded-lg" onClick={() => navigate(`/projects/${id}/measurements`)}>{hasSession ? 'Openen' : 'Starten'}</Button>
        }>
          {hasSession ? (<><DesktopInfoRow label="Datum" value={formatNlDate(session?.measurement_date)} /><DesktopInfoRow label="Elektrodes" value={String(electrodes.length)} /><DesktopInfoRow label="Metingen" value={String(reportData?.stats.measurementCount || 0)} /></>) : <p className="text-sm text-muted-foreground/40">Nog geen meetsessie.</p>}
        </DesktopSection>
        <DesktopSection title="Rapport" action={
          <div className="flex gap-1">
            <Button variant="outline" size="sm" className="rounded-lg" onClick={() => navigate(`/projects/${id}/report`)}>Bekijk</Button>
            {isReportReady && <Button size="sm" className="rounded-lg" onClick={() => { navigate(`/projects/${id}/report`); setTimeout(() => window.print(), 500); }}><Printer className="h-3.5 w-3.5" /></Button>}
          </div>
        }>
          {isReportReady ? (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[hsl(var(--status-completed))]" />
              <span className="text-sm font-medium text-foreground">Gereed</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500/70" />
              <span className="text-sm text-muted-foreground/50">Voltooi eerst de metingen</span>
            </div>
          )}
        </DesktopSection>
        <ReadinessChecklist items={readinessItems} />
      </div>

      <div className="mt-8 flex gap-2">
        {project.status === 'planned' ? (
          <Button className="rounded-xl" onClick={() => handleStatusChange('completed')} disabled={updateMut.isPending || !isReportReady}><CheckCircle2 className="mr-2 h-4 w-4" /> Afronden</Button>
        ) : (
          <Button variant="outline" className="rounded-xl" onClick={() => handleStatusChange('planned')} disabled={updateMut.isPending}><RotateCcw className="mr-2 h-4 w-4" /> Heropenen</Button>
        )}
        <Button variant="ghost" className="text-destructive/50 rounded-xl" onClick={handleDelete} disabled={deleteMut.isPending}><Trash2 className="mr-2 h-4 w-4" /> Verwijderen</Button>
      </div>
    </div>
  );
}

/* ── Shared components ── */

function StatusIndicator({ status }: { status: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={cn(
        'w-[6px] h-[6px] rounded-full',
        status === 'completed' ? 'bg-[hsl(var(--status-completed))]' : 'bg-[hsl(var(--status-planned)/0.4)]'
      )} />
      <span className="text-[11px] text-muted-foreground/45 font-medium">
        {status === 'completed' ? 'Afgerond' : 'Gepland'}
      </span>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] uppercase tracking-[0.08em] font-semibold text-muted-foreground/35 mb-2">{children}</p>
  );
}

function SecondaryAction({ icon: Icon, label, onClick }: { icon: React.ElementType; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex-1 flex items-center justify-center gap-2 rounded-2xl ios-group py-3 active:scale-[0.97] transition-all"
    >
      <Icon className="h-4 w-4 text-muted-foreground/50" />
      <span className="text-[13px] font-medium text-foreground">{label}</span>
    </button>
  );
}

function InfoLine({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 ios-row">
      <span className="text-[12px] text-muted-foreground/45">{label}</span>
      <span className="text-[13px] text-foreground font-medium truncate ml-4 text-right">{value || '—'}</span>
    </div>
  );
}

function ProgressStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-[20px] font-bold text-foreground tabular-nums">{value}</span>
      <span className="text-[11px] text-muted-foreground/40">{label}</span>
    </div>
  );
}

function DesktopSection({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[13px] font-semibold text-foreground">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

function DesktopInfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-center py-2 border-b border-border/15 last:border-0">
      <span className="text-sm text-muted-foreground/45 w-36 shrink-0">{label}</span>
      <span className="text-sm text-foreground">{value || '—'}</span>
    </div>
  );
}
