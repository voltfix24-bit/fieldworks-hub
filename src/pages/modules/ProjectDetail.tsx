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
  return (
    <div className="animate-fade-in max-w-5xl">
      {/* ── Top bar: back + actions ── */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate('/projects')}
          className="flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground/50 hover:text-foreground transition-colors group">
          <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Projecten
        </button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="rounded-lg h-9 px-4 text-[12px] font-semibold border-border/40" onClick={() => navigate(`/projects/${id}/edit`)}>
            <Pencil className="mr-1.5 h-3.5 w-3.5" /> Bewerken
          </Button>
          <Button variant="outline" size="sm" className="rounded-lg h-9 px-4 text-[12px] font-semibold border-border/40" onClick={() => navigate(`/projects/${id}/report`)}>
            <FileText className="mr-1.5 h-3.5 w-3.5" /> Rapport
          </Button>
          <Button size="sm" className="rounded-lg h-9 px-5 text-[12px] font-bold tracking-wide shadow-[0_2px_8px_hsl(var(--primary)/0.2)]" onClick={() => navigate(`/projects/${id}/measurements`)}>
            <Play className="mr-1.5 h-3.5 w-3.5" /> METINGEN
          </Button>
        </div>
      </div>

      {/* ── Project hero header ── */}
      <div className="bg-card rounded-xl border border-border/50 shadow-sm px-6 py-5 mb-5">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1.5">
              <h1 className="text-[22px] font-display font-extrabold tracking-tight text-foreground leading-none truncate">{project.project_name}</h1>
              <StatusBadge status={project.status} />
            </div>
            <div className="flex items-center gap-3 text-[12px]">
              <span className="font-mono text-muted-foreground/40 tabular-nums">{project.project_number}</span>
              {project.city && (
                <>
                  <span className="w-px h-3 bg-border/30" />
                  <span className="text-muted-foreground/40 flex items-center gap-1">
                    <span className="w-1 h-1 rounded-full bg-muted-foreground/20" />
                    {[project.address_line_1, project.city].filter(Boolean).join(', ')}
                  </span>
                </>
              )}
              {session?.measurement_date && (
                <>
                  <span className="w-px h-3 bg-border/30" />
                  <span className="text-muted-foreground/40 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Gemeten {formatNlDate(session.measurement_date)}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Progress ring */}
          {hasSession && (
            <div className="flex items-center gap-4 ml-6">
              <div className="text-right">
                <span className="text-[22px] font-display font-extrabold text-foreground leading-none tabular-nums">{metReadyCount}/{metRequiredTotal}</span>
                <p className="text-[10px] text-muted-foreground/35 font-medium mt-0.5">GEREED</p>
              </div>
            </div>
          )}
        </div>

        {/* Quick stats row */}
        {hasSession && (
          <div className="flex items-center gap-6 mt-4 pt-4 border-t border-border/20">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center">
                <GroundingIcon size={16} />
              </div>
              <div>
                <span className="text-[15px] font-bold text-foreground tabular-nums leading-none">{electrodes.length}</span>
                <p className="text-[10px] text-muted-foreground/35 font-medium">Elektrodes</p>
              </div>
            </div>
            <div className="w-px h-8 bg-border/20" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center">
                <GroundingIcon size={16} />
              </div>
              <div>
                <span className="text-[15px] font-bold text-foreground tabular-nums leading-none">{reportData?.stats.measurementCount || 0}</span>
                <p className="text-[10px] text-muted-foreground/35 font-medium">Metingen</p>
              </div>
            </div>
            <div className="w-px h-8 bg-border/20" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-muted/40 flex items-center justify-center">
                <FileText className="h-4 w-4 text-muted-foreground/30" />
              </div>
              <div>
                <span className="text-[15px] font-bold text-foreground tabular-nums leading-none">{reportData?.stats.photosCount || 0}</span>
                <p className="text-[10px] text-muted-foreground/35 font-medium">Foto's</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Info grid ── */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <DSection title="Projectoverzicht" icon="📋">
          <DInfoRow label="Geplande datum" value={formatNlDate(project.planned_date)} />
          {project.completed_date && <DInfoRow label="Afgerond" value={formatNlDate(project.completed_date)} />}
          <DInfoRow label="Locatie" value={[project.address_line_1, project.postal_code, project.city].filter(Boolean).join(', ') || null} />
          {project.cable_material && <DInfoRow label="Kabelmateriaal" value={project.cable_material} />}
          {project.target_value && <DInfoRow label="Streefwaarde" value={`${project.target_value} Ω`} />}
        </DSection>

        <DSection title="Klant" icon="🏢"
          action={client && <Button variant="ghost" size="sm" className="rounded-lg h-7 text-[11px] text-muted-foreground/40 hover:text-foreground" onClick={() => navigate(`/clients/${project.client_id}`)}>Bekijk →</Button>}>
          {client ? (
            <><DInfoRow label="Bedrijf" value={client.company_name} highlight /><DInfoRow label="Contact" value={client.contact_name} /><DInfoRow label="E-mail" value={client.email} /><DInfoRow label="Telefoon" value={client.phone} /></>
          ) : <p className="text-[12px] text-muted-foreground/30 py-2">Geen klant toegewezen</p>}
        </DSection>

        <DSection title="Monteur" icon="👷"
          action={tech && <Button variant="ghost" size="sm" className="rounded-lg h-7 text-[11px] text-muted-foreground/40 hover:text-foreground" onClick={() => navigate(`/technicians/${project.technician_id}`)}>Bekijk →</Button>}>
          {tech ? (
            <><DInfoRow label="Naam" value={tech.full_name} highlight /><DInfoRow label="Code" value={tech.employee_code} /></>
          ) : <p className="text-[12px] text-muted-foreground/30 py-2">Geen monteur toegewezen</p>}
        </DSection>

        <DSection title="Apparatuur" icon="🔧"
          action={equip && <Button variant="ghost" size="sm" className="rounded-lg h-7 text-[11px] text-muted-foreground/40 hover:text-foreground" onClick={() => navigate(`/equipment/${project.equipment_id}`)}>Bekijk →</Button>}>
          {equip ? (
            <><DInfoRow label="Apparaat" value={equip.device_name} highlight /><DInfoRow label="Merk/Model" value={[equip.brand, equip.model].filter(Boolean).join(' ') || null} /><DInfoRow label="Serienummer" value={equip.serial_number} /></>
          ) : <p className="text-[12px] text-muted-foreground/30 py-2">Geen apparatuur toegewezen</p>}
        </DSection>
      </div>

      {/* Notes */}
      {project.notes && (
        <div className="bg-card rounded-xl border border-border/50 shadow-sm p-5 mb-5">
          <h3 className="text-[11px] font-bold text-muted-foreground/40 uppercase tracking-[0.08em] mb-2">Notities</h3>
          <p className="text-[13px] text-foreground/80 whitespace-pre-wrap leading-relaxed">{project.notes}</p>
        </div>
      )}

      {/* Project files */}
      {(() => {
        const projectBestanden = attachments.filter((a: any) => a.attachment_type === 'project_bestand');
        if (projectBestanden.length === 0) return null;
        return (
          <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden mb-5">
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

      {/* ── Workflow section ── */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {/* Meetopstelling */}
        <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border/30 bg-muted/15 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={cn(
                'w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold',
                hasSession ? 'bg-[hsl(var(--status-completed))]/15 text-[hsl(var(--status-completed))]' : 'bg-muted/60 text-muted-foreground/30',
              )}>1</span>
              <h3 className="text-[12px] font-bold text-foreground">Meetopstelling</h3>
            </div>
            <Button variant="ghost" size="sm" className="rounded-lg h-7 text-[11px] px-3" onClick={() => navigate(`/projects/${id}/measurements`)}>
              {hasSession ? 'Openen' : 'Starten'} →
            </Button>
          </div>
          <div className="p-5">
            {hasSession ? (
              <div className="space-y-0">
                <DInfoRow label="Datum" value={formatNlDate(session?.measurement_date)} />
                <DInfoRow label="Elektrodes" value={String(electrodes.length)} />
                <DInfoRow label="Metingen" value={String(reportData?.stats.measurementCount || 0)} />
              </div>
            ) : (
              <div className="py-4 text-center">
                <div className="w-10 h-10 rounded-xl bg-muted/30 flex items-center justify-center mx-auto mb-2">
                  <Play className="h-4 w-4 text-muted-foreground/20" />
                </div>
                <p className="text-[12px] text-muted-foreground/30">Nog niet gestart</p>
              </div>
            )}
          </div>
        </div>

        {/* Rapport */}
        <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border/30 bg-muted/15 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={cn(
                'w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold',
                isReportReady ? 'bg-[hsl(var(--status-completed))]/15 text-[hsl(var(--status-completed))]' : 'bg-muted/60 text-muted-foreground/30',
              )}>2</span>
              <h3 className="text-[12px] font-bold text-foreground">Rapport</h3>
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" className="rounded-lg h-7 text-[11px] px-3" onClick={() => navigate(`/projects/${id}/report`)}>
                Bekijk →
              </Button>
            </div>
          </div>
          <div className="p-5">
            {isReportReady ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[hsl(var(--status-completed))]/10 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-[hsl(var(--status-completed))]" />
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-foreground">Rapport gereed</p>
                  <p className="text-[11px] text-muted-foreground/35">Alle gegevens compleet</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/8 flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-amber-500/60" />
                </div>
                <div>
                  <p className="text-[13px] font-medium text-foreground/70">Niet compleet</p>
                  <p className="text-[11px] text-muted-foreground/35">Voltooi eerst de metingen</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Gereedheid */}
        <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border/30 bg-muted/15 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={cn(
                'w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold',
                allRequiredMet ? 'bg-[hsl(var(--status-completed))]/15 text-[hsl(var(--status-completed))]' : 'bg-muted/60 text-muted-foreground/30',
              )}>3</span>
              <h3 className="text-[12px] font-bold text-foreground">Gereedheid</h3>
            </div>
            <span className={cn(
              'text-[10px] font-bold px-2 py-0.5 rounded-md tabular-nums',
              allRequiredMet
                ? 'bg-[hsl(var(--status-completed))]/10 text-[hsl(var(--status-completed))]'
                : 'bg-muted/40 text-muted-foreground/40',
            )}>
              {allRequiredMet ? '✓ GEREED' : `${metReadyCount}/${metRequiredTotal}`}
            </span>
          </div>
          <div className="p-4">
            {readinessItems.map((item, i) => (
              <div key={item.label} className={cn(
                'flex items-center gap-2.5 py-2',
                i < readinessItems.length - 1 && 'border-b border-border/10',
              )}>
                {item.met ? (
                  <CheckCircle2 className="h-4 w-4 text-[hsl(var(--status-completed))] shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-border/30 shrink-0" />
                )}
                <span className={cn(
                  'text-[12px] flex-1',
                  item.met ? 'text-foreground/70 font-medium' : 'text-muted-foreground/35',
                  item.optional && !item.met && 'italic',
                )}>{item.label}</span>
                {item.optional && (
                  <span className="text-[9px] text-muted-foreground/25 font-medium uppercase tracking-wider">opt</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom actions ── */}
      <div className="bg-card rounded-xl border border-border/50 shadow-sm px-5 py-4 flex items-center justify-between">
        <div>
          {project.status === 'planned' ? (
            <Button className="rounded-lg h-10 px-6 font-bold text-[13px] tracking-wide shadow-[0_2px_8px_hsl(var(--primary)/0.2)]"
              onClick={() => handleStatusChange('completed')} disabled={updateMut.isPending || !isReportReady}>
              <CheckCircle2 className="mr-2 h-4 w-4" /> PROJECT AFRONDEN
            </Button>
          ) : (
            <Button variant="outline" className="rounded-lg h-10 px-5 text-[13px] font-semibold"
              onClick={() => handleStatusChange('planned')} disabled={updateMut.isPending}>
              <RotateCcw className="mr-2 h-4 w-4" /> Heropenen
            </Button>
          )}
          {!isReportReady && project.status === 'planned' && (
            <span className="ml-3 text-[11px] text-muted-foreground/30">Voltooi eerst alle vereiste onderdelen</span>
          )}
        </div>
        <button onClick={() => setShowDeleteConfirm(true)} disabled={deleteMut.isPending}
          className="flex items-center gap-1.5 text-[11px] font-medium text-destructive/40 hover:text-destructive/70 transition-colors">
          <Trash2 className="h-3.5 w-3.5" /> Verwijderen
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

function DSection({ title, icon, children, action }: { title: string; icon?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="bg-card rounded-xl border border-border/50 shadow-sm overflow-hidden">
      <div className="px-5 py-3 border-b border-border/30 bg-muted/15 flex items-center justify-between">
        <h3 className="text-[11px] font-bold text-muted-foreground/45 uppercase tracking-[0.08em] flex items-center gap-2">
          {icon && <span className="text-[13px]">{icon}</span>}
          {title}
        </h3>
        {action}
      </div>
      <div className="p-5">
        {children}
      </div>
    </div>
  );
}

function DInfoRow({ label, value, highlight = false }: { label: string; value?: string | null; highlight?: boolean }) {
  return (
    <div className="flex items-center py-2 border-b border-border/10 last:border-0">
      <span className="text-[12px] text-muted-foreground/40 w-32 shrink-0">{label}</span>
      <span className={cn(
        'text-[12px]',
        value ? (highlight ? 'text-foreground font-semibold' : 'text-foreground/80') : 'text-muted-foreground/20',
      )}>{value || '—'}</span>
    </div>
  );
}
