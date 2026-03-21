import { useState } from 'react';
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
    try {
      await deleteMut.mutateAsync(project.id);
      toast({ title: 'Project verwijderd' });
      navigate('/projects');
    } catch (err: any) { toast({ title: 'Fout', description: err.message, variant: 'destructive' }); }
  };

  const metReadyCount = readinessItems.filter(i => !i.optional && i.met).length;
  const metRequiredTotal = readinessItems.filter(i => !i.optional).length;
  const allRequiredMet = metReadyCount === metRequiredTotal;

  // ── Mobile ──
  if (isMobile) {
    return (
      <>
        <div className="ios-detail-page animate-fade-in">
          {/* Back row */}
          <button
            onClick={() => navigate('/projects')}
            className="ios-detail-back"
          >
            <svg width="8" height="14" viewBox="0 0 8 14" fill="none"><path d="M7 1L1 7L7 13" stroke="hsl(var(--tenant-primary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span>Projecten</span>
          </button>

          {/* Title */}
          <h1 className="ios-detail-title">{project.project_name}</h1>
          <div className="ios-detail-meta">
            <span className="ios-detail-code">{project.project_number}</span>
            <span className={cn('ios-detail-status-pill', project.status === 'completed' ? 'completed' : 'planned')}>
              <span className="ios-detail-status-dot" />
              {project.status === 'completed' ? 'Afgerond' : 'Gepland'}
            </span>
          </div>

          <div className="ios-detail-scroll">
            {/* Metingen hero card */}
            <button
              className="ios-detail-hero"
              onClick={() => navigate(`/projects/${id}/measurements`)}
            >
              <div className="ios-detail-hero-icon">
                <GroundingIcon size={22} color="white" />
              </div>
              <div className="ios-detail-hero-text">
                <span className="ios-detail-hero-title">{hasSession ? 'Metingen' : 'Meten starten'}</span>
                {hasSession && hasMeasurements && (
                  <span className="ios-detail-hero-sub">{electrodes.length} elektrodes · {reportData?.stats.measurementCount} metingen</span>
                )}
              </div>
              <ChevronRight className="h-5 w-5 text-white/40" />
            </button>

            {/* Action buttons */}
            <div className="ios-detail-actions">
              <button className="ios-detail-action-btn" onClick={() => navigate(`/projects/${id}/report`)}>
                <FileText className="h-[18px] w-[18px] text-muted-foreground" />
                Rapport
              </button>
              <button className="ios-detail-action-btn" onClick={() => navigate(`/projects/${id}/edit`)}>
                <Pencil className="h-[18px] w-[18px] text-muted-foreground" />
                Bewerken
              </button>
            </div>

            {/* Projectgegevens */}
            <p className="ios-detail-section-label">Projectgegevens</p>
            <div className="ios-detail-card">
              {[
                { label: 'Locatie', value: [project.address_line_1, project.city].filter(Boolean).join(', ') },
                { label: 'Klant', value: client?.company_name },
                { label: 'Monteur', value: tech?.full_name },
                { label: 'Apparaat', value: equip?.device_name },
                { label: 'Datum', value: formatNlDate(project.planned_date) },
              ].map((row, i, arr) => (
                <div key={row.label}>
                  <div className="ios-detail-info-row">
                    <span className="ios-detail-info-label">{row.label}</span>
                    <span className={cn('ios-detail-info-value', row.value && 'has-value')}>{row.value || '—'}</span>
                  </div>
                  {i < arr.length - 1 && <div className="ios-detail-divider" />}
                </div>
              ))}
            </div>

            {/* Voortgang */}
            {hasSession && (
              <>
                <p className="ios-detail-section-label">Voortgang</p>
                <div className="ios-detail-stats">
                  <div className="ios-detail-stat">
                    <span className="ios-detail-stat-dot" style={{ background: 'hsl(var(--tenant-primary))' }} />
                    <span className="ios-detail-stat-value">{electrodes.length}</span>
                    <span className="ios-detail-stat-label">Elektrodes</span>
                  </div>
                  <div className="ios-detail-stat">
                    <span className="ios-detail-stat-dot" style={{ background: 'hsl(210, 100%, 50%)' }} />
                    <span className="ios-detail-stat-value">{reportData?.stats.measurementCount || 0}</span>
                    <span className="ios-detail-stat-label">Metingen</span>
                  </div>
                  <div className="ios-detail-stat">
                    <span className="ios-detail-stat-dot" style={{ background: 'hsl(var(--muted-foreground))' }} />
                    <span className="ios-detail-stat-value">{reportData?.stats.photosCount || 0}</span>
                    <span className="ios-detail-stat-label">Foto's</span>
                  </div>
                </div>
              </>
            )}

            {/* Gereedheid */}
            <div className="ios-detail-card">
              <div className="ios-detail-gereedheid-header">
                <span className="ios-detail-section-label" style={{ padding: 0, margin: 0 }}>Gereedheid</span>
                <span className={cn('ios-detail-gereedheid-badge', allRequiredMet ? 'ready' : 'pending')}>
                  {allRequiredMet ? '✓ Gereed' : `${metReadyCount}/${metRequiredTotal}`}
                </span>
              </div>
              <div className="ios-detail-divider" />
              {readinessItems.map((item, i) => (
                <div key={item.label}>
                  <div className="ios-detail-check-row">
                    {item.met ? (
                      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                        <circle cx="11" cy="11" r="11" fill="hsl(152, 60%, 42%)" fillOpacity="0.14"/>
                        <path d="M7 11.2L9.8 14L15 8.5" stroke="hsl(152, 60%, 42%)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : (
                      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                        <circle cx="11" cy="11" r="10.5" stroke="hsl(var(--border))" strokeOpacity="0.6"/>
                      </svg>
                    )}
                    <span className={cn('ios-detail-check-label', item.optional && !item.met && 'optional')}>
                      {item.label}
                    </span>
                    {item.optional && <span className="ios-detail-optional-badge">optioneel</span>}
                  </div>
                  {i < readinessItems.length - 1 && <div className="ios-detail-divider" />}
                </div>
              ))}
            </div>

            {/* Project afronden CTA */}
            {project.status === 'planned' ? (
              <button
                className="ios-detail-cta-complete"
                onClick={() => handleStatusChange('completed')}
                disabled={updateMut.isPending || !isReportReady}
              >
                <CheckCircle2 className="h-5 w-5" />
                Project afronden
              </button>
            ) : (
              <button
                className="ios-detail-cta-reopen"
                onClick={() => handleStatusChange('planned')}
                disabled={updateMut.isPending}
              >
                <RotateCcw className="h-4 w-4" />
                Heropenen
              </button>
            )}

            {/* Danger zone */}
            <div className="ios-detail-card">
              <button className="ios-detail-danger-row" onClick={() => setShowDeleteConfirm(true)}>
                <Trash2 className="h-4 w-4" />
                Project verwijderen
              </button>
            </div>
          </div>
        </div>

        {/* Delete confirmation overlay */}
        {showDeleteConfirm && (
          <div className="ios-detail-confirm-backdrop" onClick={() => setShowDeleteConfirm(false)}>
            <div className="ios-detail-confirm-sheet" onClick={e => e.stopPropagation()}>
              <div className="ios-detail-confirm-handle" />
              <h3 className="ios-detail-confirm-title">Project verwijderen?</h3>
              <p className="ios-detail-confirm-sub">Dit kan niet ongedaan worden gemaakt.</p>
              <div className="ios-detail-confirm-actions">
                <button
                  className="ios-detail-confirm-delete"
                  onClick={() => { setShowDeleteConfirm(false); handleDelete(); }}
                >
                  Verwijderen
                </button>
                <button
                  className="ios-detail-confirm-cancel"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Annuleren
                </button>
              </div>
            </div>
          </div>
        )}
      </>
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
        <Button variant="ghost" className="text-destructive/50 rounded-xl" onClick={() => setShowDeleteConfirm(true)} disabled={deleteMut.isPending}><Trash2 className="mr-2 h-4 w-4" /> Verwijderen</Button>
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowDeleteConfirm(false)}>
          <div className="bg-card rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-2">Project verwijderen?</h3>
            <p className="text-sm text-muted-foreground mb-6">Dit kan niet ongedaan worden gemaakt.</p>
            <div className="flex gap-2">
              <Button variant="destructive" className="flex-1 rounded-xl" onClick={() => { setShowDeleteConfirm(false); handleDelete(); }}>Verwijderen</Button>
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowDeleteConfirm(false)}>Annuleren</Button>
            </div>
          </div>
        </div>
      )}
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
