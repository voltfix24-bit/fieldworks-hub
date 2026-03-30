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
import { Loader } from '@/components/ui/loader';
import { cn } from '@/lib/utils';
import {
  ArrowLeft, Pencil, Trash2, CheckCircle2, RotateCcw,
  FileText, Play, Printer, AlertCircle, ChevronRight, Calendar, Download
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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

  if (isLoading) return <Loader />;
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

  const metingGestart = hasSession && hasElectrodes;
  const metingKlaar = isReportReady;

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
          {session?.measurement_date && (
            <div className="flex items-center gap-1.5 mt-1 px-4">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground/30" />
              <span className="text-[12px] text-muted-foreground/40">
                Gemeten op {formatNlDate(session.measurement_date)}
              </span>
            </div>
          )}

          <div className="ios-detail-scroll">
            {/* Continue measuring CTA */}
            {metingGestart && !metingKlaar && (
              <button
                onClick={() => navigate(`/projects/${id}/measurements`)}
                className="w-full flex items-center gap-3 rounded-2xl px-4 py-3.5 mb-4 bg-[hsl(var(--tenant-primary)/0.08)] border border-[hsl(var(--tenant-primary)/0.2)] active:scale-[0.98] transition-all"
              >
                <div className="w-9 h-9 rounded-xl bg-[hsl(var(--tenant-primary))] flex items-center justify-center shrink-0">
                  <Play className="h-4 w-4 text-white ml-0.5" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-[14px] font-bold text-[hsl(var(--tenant-primary))]">
                    Doorgaan met meten
                  </p>
                  <p className="text-[11px] text-muted-foreground/50 mt-0.5">
                    Meting is nog niet afgerond
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-[hsl(var(--tenant-primary)/0.4)]" />
              </button>
            )}

            {/* Metingen hero card */}
            <button
              className="ios-detail-hero"
              onClick={() => navigate(`/projects/${id}/measurements`)}
            >
              <div className="ios-detail-hero-icon">
                <GroundingIcon size={22} />
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

            {/* Projectbestanden */}
            {(() => {
              const projectBestanden = attachments.filter((a: any) => a.attachment_type === 'project_bestand');
              if (projectBestanden.length === 0) return null;
              return (
                <div className="mt-4">
                  <p className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground/40 mb-2 px-1">Projectbestanden</p>
                  <div className="ios-dash-card">
                    {projectBestanden.map((bestand: any, i: number) => (
                      <div key={bestand.id}>
                        <button
                          onClick={async () => {
                            const { data } = await supabase.storage.from('project-files').createSignedUrl(bestand.file_url, 3600);
                            if (data?.signedUrl) window.open(data.signedUrl, '_blank');
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3.5 min-h-[56px] active:bg-foreground/[0.03] transition-colors text-left"
                        >
                          <div className="w-9 h-9 rounded-xl bg-[hsl(var(--tenant-primary)/0.08)] flex items-center justify-center shrink-0">
                            <FileText className="h-4 w-4 text-[hsl(var(--tenant-primary))]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[14px] font-semibold text-foreground truncate">{bestand.caption || 'Bestand'}</p>
                            <p className="text-[11px] text-muted-foreground/40 mt-0.5">Tik om te openen of downloaden</p>
                          </div>
                          <Download className="h-4 w-4 text-muted-foreground/20 shrink-0" />
                        </button>
                        {i < projectBestanden.length - 1 && <div className="ios-dash-row-divider" />}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

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

  // ═══════════════════════════════════════════════════════
  // DESKTOP
  // ═══════════════════════════════════════════════════════

  // Determine the primary next action
  const nextAction = !hasSession
    ? { label: 'Meting starten', sub: 'Start de meetopstelling voor dit project', icon: Play }
    : !metingKlaar
    ? { label: 'Doorgaan met meten', sub: `${metReadyCount}/${metRequiredTotal} onderdelen gereed`, icon: Play }
    : project.status === 'planned'
    ? { label: 'Project afronden', sub: 'Alle metingen en gegevens zijn compleet', icon: CheckCircle2 }
    : null;

  return (
    <div className="animate-fade-in max-w-5xl">
      {/* ── Breadcrumb + actions ── */}
      <div className="flex items-center justify-between mb-5">
        <button onClick={() => navigate('/projects')}
          className="flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground/45 hover:text-foreground transition-colors group">
          <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Projecten
        </button>
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="sm" className="rounded-lg h-8 px-3 text-[11px] font-semibold text-muted-foreground/50 hover:text-foreground" onClick={() => navigate(`/projects/${id}/edit`)}>
            <Pencil className="mr-1.5 h-3 w-3" /> Bewerken
          </Button>
          <Button variant="ghost" size="sm" className="rounded-lg h-8 px-3 text-[11px] font-semibold text-muted-foreground/50 hover:text-foreground" onClick={() => navigate(`/projects/${id}/report`)}>
            <FileText className="mr-1.5 h-3 w-3" /> Rapport
          </Button>
          <div className="w-px h-5 bg-border/25 mx-1" />
          <Button size="sm" className="rounded-lg h-8 px-4 text-[11px] font-bold tracking-wide" onClick={() => navigate(`/projects/${id}/measurements`)}>
            <Play className="mr-1.5 h-3 w-3" /> METINGEN
          </Button>
        </div>
      </div>

      {/* ── Project hero ── */}
      <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden mb-5">
        <div className="px-6 py-5">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-[22px] font-display font-extrabold tracking-tight text-foreground leading-none truncate">{project.project_name}</h1>
                <StatusBadge status={project.status} />
              </div>
              <div className="flex items-center gap-3 flex-wrap text-[11px]">
                <span className="font-mono text-muted-foreground/35 tabular-nums">{project.project_number}</span>
                {project.city && (
                  <>
                    <span className="w-[3px] h-[3px] rounded-full bg-border/60" />
                    <span className="text-muted-foreground/40">{[project.address_line_1, project.city].filter(Boolean).join(', ')}</span>
                  </>
                )}
                {session?.measurement_date && (
                  <>
                    <span className="w-[3px] h-[3px] rounded-full bg-border/60" />
                    <span className="text-muted-foreground/40 flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Gemeten {formatNlDate(session.measurement_date)}
                    </span>
                  </>
                )}
                {project.planned_date && !session?.measurement_date && (
                  <>
                    <span className="w-[3px] h-[3px] rounded-full bg-border/60" />
                    <span className="text-muted-foreground/40 flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Gepland {formatNlDate(project.planned_date)}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Stats cluster */}
            <div className="flex items-center gap-5 ml-6 shrink-0">
              {[
                { val: electrodes.length, label: 'Elektrodes', active: hasElectrodes },
                { val: reportData?.stats.measurementCount || 0, label: 'Metingen', active: hasMeasurements },
                { val: reportData?.stats.photosCount || 0, label: "Foto's", active: (reportData?.stats.photosCount || 0) > 0 },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <span className={cn(
                    'text-[18px] font-display font-extrabold leading-none tabular-nums block',
                    s.active ? 'text-foreground' : 'text-muted-foreground/20',
                  )}>{s.val}</span>
                  <span className="text-[9px] text-muted-foreground/30 font-semibold uppercase tracking-wider mt-1 block">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Next action banner */}
        {nextAction && (
          <button
            onClick={() => {
              if (nextAction.label === 'Project afronden') handleStatusChange('completed');
              else navigate(`/projects/${id}/measurements`);
            }}
            disabled={nextAction.label === 'Project afronden' && (updateMut.isPending || !isReportReady)}
            className="w-full flex items-center gap-4 px-6 py-3.5 border-t border-primary/10 bg-primary/[0.03] hover:bg-primary/[0.06] transition-colors text-left group"
          >
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
              <nextAction.icon className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[13px] font-bold text-primary block">{nextAction.label}</span>
              <span className="text-[11px] text-muted-foreground/40">{nextAction.sub}</span>
            </div>
            <ChevronRight className="h-4 w-4 text-primary/30 group-hover:text-primary/50 transition-colors shrink-0" />
          </button>
        )}
      </div>

      {/* ── Two-column layout: info + checklist ── */}
      <div className="grid grid-cols-12 gap-4 mb-5">
        {/* Left: info cards */}
        <div className="col-span-8 grid grid-cols-2 gap-3">
          <DSection title="Projectoverzicht">
            <DInfoRow label="Geplande datum" value={formatNlDate(project.planned_date)} />
            {project.completed_date && <DInfoRow label="Afgerond" value={formatNlDate(project.completed_date)} />}
            <DInfoRow label="Locatie" value={[project.address_line_1, project.postal_code, project.city].filter(Boolean).join(', ') || null} />
            {project.cable_material && <DInfoRow label="Kabelmateriaal" value={project.cable_material} />}
            {project.target_value && <DInfoRow label="Streefwaarde" value={`${project.target_value} Ω`} />}
          </DSection>

          <DSection title="Klant"
            action={client && <button className="text-[10px] font-semibold text-primary/50 hover:text-primary transition-colors" onClick={() => navigate(`/clients/${project.client_id}`)}>Bekijk →</button>}>
            {client ? (
              <><DInfoRow label="Bedrijf" value={client.company_name} highlight /><DInfoRow label="Contact" value={client.contact_name} /><DInfoRow label="E-mail" value={client.email} /><DInfoRow label="Telefoon" value={client.phone} /></>
            ) : <EmptyField text="Geen klant toegewezen" />}
          </DSection>

          <DSection title="Monteur"
            action={tech && <button className="text-[10px] font-semibold text-primary/50 hover:text-primary transition-colors" onClick={() => navigate(`/technicians/${project.technician_id}`)}>Bekijk →</button>}>
            {tech ? (
              <><DInfoRow label="Naam" value={tech.full_name} highlight /><DInfoRow label="Code" value={tech.employee_code} /></>
            ) : <EmptyField text="Geen monteur toegewezen" />}
          </DSection>

          <DSection title="Apparatuur"
            action={equip && <button className="text-[10px] font-semibold text-primary/50 hover:text-primary transition-colors" onClick={() => navigate(`/equipment/${project.equipment_id}`)}>Bekijk →</button>}>
            {equip ? (
              <><DInfoRow label="Apparaat" value={equip.device_name} highlight /><DInfoRow label="Merk/Model" value={[equip.brand, equip.model].filter(Boolean).join(' ') || null} /><DInfoRow label="Serienr." value={equip.serial_number} /></>
            ) : <EmptyField text="Geen apparatuur toegewezen" />}
          </DSection>
        </div>

        {/* Right: gereedheid panel */}
        <div className="col-span-4">
          <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden sticky top-6">
            {/* Header */}
            <div className="px-5 py-3.5 border-b border-border/30 bg-muted/15 flex items-center justify-between">
              <h3 className="text-[11px] font-bold text-muted-foreground/45 uppercase tracking-[0.08em]">Gereedheid</h3>
              <span className={cn(
                'text-[10px] font-bold px-2.5 py-1 rounded-md tabular-nums',
                allRequiredMet
                  ? 'bg-[hsl(var(--status-completed))]/10 text-[hsl(var(--status-completed))]'
                  : 'bg-muted/40 text-muted-foreground/40',
              )}>
                {allRequiredMet ? '✓ GEREED' : `${metReadyCount} / ${metRequiredTotal}`}
              </span>
            </div>

            {/* Progress bar */}
            <div className="px-5 pt-4 pb-2">
              <div className="w-full h-1.5 rounded-full bg-muted/40 overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    allRequiredMet ? 'bg-[hsl(var(--status-completed))]' : 'bg-primary/50',
                  )}
                  style={{ width: `${(metReadyCount / metRequiredTotal) * 100}%` }}
                />
              </div>
            </div>

            {/* Checklist */}
            <div className="px-4 pb-4">
              {readinessItems.map((item, i) => (
                <div key={item.label} className={cn(
                  'flex items-center gap-2.5 px-1 py-2.5',
                  i < readinessItems.length - 1 && 'border-b border-border/8',
                )}>
                  {item.met ? (
                    <div className="w-5 h-5 rounded-md bg-[hsl(var(--status-completed))]/12 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="h-3.5 w-3.5 text-[hsl(var(--status-completed))]" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-md border-2 border-border/25 shrink-0" />
                  )}
                  <span className={cn(
                    'text-[12px] flex-1 leading-tight',
                    item.met ? 'text-foreground/70 font-medium' : 'text-muted-foreground/30',
                  )}>{item.label}</span>
                  {item.optional && (
                    <span className="text-[8px] text-muted-foreground/20 font-bold uppercase tracking-widest">opt</span>
                  )}
                </div>
              ))}
            </div>

            {/* Workflow steps */}
            <div className="border-t border-border/20">
              {[
                { step: 1, label: 'Meetopstelling', done: hasSession, detail: hasSession ? `${electrodes.length} elektrodes · ${reportData?.stats.measurementCount || 0} metingen` : 'Nog niet gestart', onClick: () => navigate(`/projects/${id}/measurements`) },
                { step: 2, label: 'Rapport', done: isReportReady, detail: isReportReady ? 'Alle gegevens compleet' : 'Voltooi eerst de metingen', onClick: () => navigate(`/projects/${id}/report`) },
              ].map(wf => (
                <button key={wf.step} onClick={wf.onClick}
                  className="w-full flex items-center gap-3 px-5 py-3 border-b border-border/10 last:border-0 hover:bg-muted/20 transition-colors text-left group">
                  <span className={cn(
                    'w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0',
                    wf.done ? 'bg-[hsl(var(--status-completed))]/12 text-[hsl(var(--status-completed))]' : 'bg-muted/50 text-muted-foreground/25',
                  )}>{wf.done ? '✓' : wf.step}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-[12px] font-semibold text-foreground/80 block">{wf.label}</span>
                    <span className="text-[10px] text-muted-foreground/30 block truncate">{wf.detail}</span>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/15 group-hover:text-muted-foreground/40 transition-colors shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Notes */}
      {project.notes && (
        <div className="bg-card rounded-xl border border-border/50 shadow-sm p-5 mb-4">
          <h3 className="text-[11px] font-bold text-muted-foreground/40 uppercase tracking-[0.08em] mb-2">Notities</h3>
          <p className="text-[13px] text-foreground/80 whitespace-pre-wrap leading-relaxed">{project.notes}</p>
        </div>
      )}

      {/* Project files */}
      {(() => {
        const projectBestanden = attachments.filter((a: any) => a.attachment_type === 'project_bestand');
        if (projectBestanden.length === 0) return null;
        return (
          <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden mb-4">
            <div className="px-5 py-3 border-b border-border/30 bg-muted/15">
              <h3 className="text-[11px] font-bold text-muted-foreground/40 uppercase tracking-[0.08em]">Projectbestanden</h3>
            </div>
            {projectBestanden.map((bestand: any, i: number) => (
              <div key={bestand.id} className={cn('flex items-center px-5 py-3', i < projectBestanden.length - 1 && 'border-b border-border/15')}>
                <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center mr-3 shrink-0">
                  <FileText className="h-3.5 w-3.5 text-primary/50" />
                </div>
                <span className="text-[13px] text-foreground flex-1 truncate font-medium">{bestand.caption || 'Bestand'}</span>
                <Button variant="ghost" size="sm" className="rounded-lg h-8 text-[11px]"
                  onClick={async () => {
                    const { data } = await supabase.storage.from('project-files').createSignedUrl(bestand.file_url, 3600);
                    if (data?.signedUrl) window.open(data.signedUrl, '_blank');
                  }}>
                  <Download className="h-3.5 w-3.5 mr-1" /> Openen
                </Button>
              </div>
            ))}
          </div>
        );
      })()}

      {/* ── Bottom action bar ── */}
      <div className="flex items-center justify-between py-4">
        <div className="flex items-center gap-3">
          {project.status === 'planned' ? (
            <Button className="rounded-lg h-9 px-5 font-bold text-[12px] tracking-wide shadow-sm"
              onClick={() => handleStatusChange('completed')} disabled={updateMut.isPending || !isReportReady}>
              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> PROJECT AFRONDEN
            </Button>
          ) : (
            <Button variant="outline" className="rounded-lg h-9 px-4 text-[12px] font-semibold"
              onClick={() => handleStatusChange('planned')} disabled={updateMut.isPending}>
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Heropenen
            </Button>
          )}
          {!isReportReady && project.status === 'planned' && (
            <span className="text-[11px] text-muted-foreground/25">Voltooi eerst alle vereiste onderdelen</span>
          )}
        </div>
        <button onClick={() => setShowDeleteConfirm(true)} disabled={deleteMut.isPending}
          className="flex items-center gap-1.5 text-[11px] font-medium text-destructive/30 hover:text-destructive/60 transition-colors">
          <Trash2 className="h-3 w-3" /> Verwijderen
        </button>
      </div>

      {/* Delete confirm */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowDeleteConfirm(false)}>
          <div className="bg-card rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl border border-border/50" onClick={e => e.stopPropagation()}>
            <h3 className="text-[16px] font-display font-bold mb-2">Project verwijderen?</h3>
            <p className="text-[13px] text-muted-foreground/50 mb-6">Dit kan niet ongedaan worden gemaakt. Alle metingen en bijlagen worden ook verwijderd.</p>
            <div className="flex gap-2">
              <Button variant="destructive" className="flex-1 rounded-lg" onClick={() => { setShowDeleteConfirm(false); handleDelete(); }}>Verwijderen</Button>
              <Button variant="outline" className="flex-1 rounded-lg" onClick={() => setShowDeleteConfirm(false)}>Annuleren</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Desktop shared components ── */

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wide shrink-0',
      status === 'completed'
        ? 'bg-[hsl(var(--status-completed))]/10 text-[hsl(var(--status-completed))]'
        : 'bg-primary/6 text-primary/70',
    )}>
      <span className={cn(
        'w-1.5 h-1.5 rounded-full',
        status === 'completed' ? 'bg-[hsl(var(--status-completed))]/60' : 'bg-primary/40',
      )} />
      {status === 'completed' ? 'AFGEROND' : 'GEPLAND'}
    </span>
  );
}

function EmptyField({ text }: { text: string }) {
  return <p className="text-[11px] text-muted-foreground/25 py-3">{text}</p>;
}

function DSection({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="bg-card rounded-xl border border-border/40 shadow-sm overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border/20 bg-muted/10 flex items-center justify-between">
        <h3 className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.08em]">{title}</h3>
        {action}
      </div>
      <div className="px-4 py-3">{children}</div>
    </div>
  );
}

function DInfoRow({ label, value, highlight = false }: { label: string; value?: string | null; highlight?: boolean }) {
  return (
    <div className="flex items-center py-1.5 border-b border-border/8 last:border-0">
      <span className="text-[11px] text-muted-foreground/35 w-28 shrink-0">{label}</span>
      <span className={cn(
        'text-[11px]',
        value ? (highlight ? 'text-foreground font-semibold' : 'text-foreground/75') : 'text-muted-foreground/15',
      )}>{value || '—'}</span>
    </div>
  );
}
