import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useProject, useUpdateProject, useDeleteProject } from '@/hooks/use-projects';
import { useMeasurementSession } from '@/hooks/use-measurement-sessions';
import { useElectrodes } from '@/hooks/use-electrodes';
import { useAttachments } from '@/hooks/use-attachments';
import { useReportData } from '@/hooks/use-report-data';
import { useReportReadiness } from '@/hooks/use-report-readiness';
import { useToast } from '@/hooks/use-toast';
import { ReadinessChecklist } from '@/components/measurement/ReadinessChecklist';
import { useIsMobile } from '@/hooks/use-mobile';
import { useRole } from '@/hooks/use-role';
import { formatNlDate } from '@/lib/nl-date';
import { GroundingIcon } from '@/components/measurement/GroundingIcon';
import { Loader } from '@/components/ui/loader';
import { cn } from '@/lib/utils';
import {
  ArrowLeft, Pencil, Trash2, CheckCircle2, RotateCcw,
  FileText, Play, Printer, AlertCircle, ChevronRight, Calendar, Download, Camera, XCircle,
  MapPin, User, Wrench, Activity, PenTool, Map as MapIcon
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { isFieldOnly } = useRole();
  const { data: project, isLoading, refetch } = useProject(id);
  const updateMut = useUpdateProject();
  const deleteMut = useDeleteProject();
  const { data: session } = useMeasurementSession(id);
  const { data: electrodes = [] } = useElectrodes(session?.id);
  const { data: attachments = [] } = useAttachments(id);
  const { data: reportData } = useReportData(id);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  // (showRapportBlock verwijderd — rapport opent altijd, geen blokkade-sheet meer)
  const [hasDiagram, setHasDiagram] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data } = await (supabase as any)
        .from('project_diagrams')
        .select('id')
        .eq('project_id', id)
        .limit(1)
        .maybeSingle();
      setHasDiagram(!!data?.id);
    })();
  }, [id]);

  // Centrale rapport-readiness: blocking errors + warnings (hook MUST run before any early return)
  const readiness = useReportReadiness(id);

  if (isLoading) return <Loader />;
  if (!project) return <p className="text-muted-foreground/40 text-center py-16">Project niet gevonden</p>;

  const client = project.clients as any;
  const tech = project.technicians as any;
  const equip = project.equipment as any;

  const hasSession = !!session;
  const hasMeasurementDate = !!session?.measurement_date;
  const hasElectrodes = electrodes.length > 0;
  const hasClient = !!client;
  const hasTechnician = !!tech;
  const hasEquipment = !!equip;
  const hasMeasurements = (reportData?.stats.measurementCount || 0) > 0;
  const hasSketches = attachments.some((a: any) => a.attachment_type === 'sketch_photo' || a.attachment_type === 'sketch_file');
  const hasPhotos = (reportData?.stats.photosCount || 0) > 0;

  const isReportReady = readiness.isReady;
  const hasReportWarnings = readiness.hasWarnings;


  // Readiness items voor de bestaande "Gereedheid"-checklist (alleen visualisatie)
  const readinessItems = [
    { label: 'Klant toegewezen', met: hasClient },
    { label: 'Monteur toegewezen', met: hasTechnician },
    { label: 'Apparatuur toegewezen', met: hasEquipment },
    { label: 'Meetdatum ingevuld', met: hasMeasurementDate },
    { label: 'Minimaal één elektrode', met: hasElectrodes },
    { label: 'Minimaal één geldige meetwaarde', met: hasMeasurements },
    { label: "Foto's toegevoegd", met: hasPhotos, optional: true },
    { label: 'Schets toegevoegd', met: hasSketches, optional: true },
    { label: 'Situatieschets gemaakt', met: hasDiagram, optional: true },
  ];

  // (primaryFix / fixTarget verwijderd — werden alleen door de dode blokkade-sheet gebruikt)


  const metingGestart = hasSession && hasElectrodes;
  const metingKlaar = isReportReady;

  const handleStatusChange = async (newStatus: 'planned' | 'completed') => {
    try {
      if (newStatus === 'completed') {
        // Server-side validatie + status update via RPC
        const { data, error } = await supabase.rpc('complete_project', { _project_id: project.id });
        if (error) throw error;
        const res = data as { ok: boolean; error?: string } | null;
        if (!res?.ok) {
          toast({ title: 'Kan niet afronden', description: res?.error || 'Verplichte gegevens ontbreken.', variant: 'destructive' });
          return;
        }
        toast({ title: 'Project afgerond' });
      } else {
        await updateMut.mutateAsync({ id: project.id, status: 'planned', completed_date: null });
        toast({ title: 'Project heropend' });
      }
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
    const projectBestanden = attachments.filter((a: any) => a.attachment_type === 'project_bestand');
    const werktekening = projectBestanden[0];
    const mobileDate = session?.measurement_date || project.planned_date;

    // Taak-completeness
    const equipmentComplete = !!equip && !!equip.serial_number && !!equip.calibration_date && !!equip.next_calibration_date;
    const measurementsComplete = !!session && hasElectrodes && hasMeasurements;
    const diagramComplete = hasDiagram || hasSketches;
    const reportComplete = readiness.isReady && diagramComplete;
    const mobileReportReady = reportComplete;

    const tasksDone = [equipmentComplete, measurementsComplete, diagramComplete, reportComplete].filter(Boolean).length;
    const progressPct = Math.round((tasksDone / 4) * 100);

    // Statusbadge
    const statusLabel =
      project.status === 'completed' ? 'Afgerond'
      : (hasSession && (hasMeasurements || hasElectrodes)) ? 'In uitvoering'
      : 'Nog te starten';
    const statusTone =
      project.status === 'completed' ? 'completed'
      : statusLabel === 'In uitvoering' ? 'inprogress'
      : 'planned';

    // Volgende stap
    let nextStep: { label: string; sub: string; href: string; icon: typeof Wrench };
    if (!equipmentComplete) {
      nextStep = {
        label: 'Meetapparatuur aanvullen',
        sub: !equip ? 'Wijs een apparaat toe' : 'Serienummer of kalibratiedatum ontbreekt',
        href: equip?.id ? `/equipment/${equip.id}` : '/equipment',
        icon: Wrench,
      };
    } else if (!measurementsComplete) {
      nextStep = {
        label: hasSession ? 'Ga verder met Metingen' : 'Start de Metingen',
        sub: hasSession ? `${electrodes.length} elektrodes · ${reportData?.stats.measurementCount || 0} metingen` : 'Nog niets gemeten',
        href: `/projects/${id}/measurements`,
        icon: Activity,
      };
    } else if (!diagramComplete) {
      nextStep = {
        label: 'Maak de Situatieschets',
        sub: 'Schets ontbreekt nog',
        href: `/projects/${id}/diagram`,
        icon: PenTool,
      };
    } else if (!readiness.isReady) {
      nextStep = {
        label: 'Projectgegevens aanvullen',
        sub: `${readiness.blockers.length} ${readiness.blockers.length === 1 ? 'blokkade' : 'blokkades'}`,
        href: `/projects/${id}/edit`,
        icon: Pencil,
      };
    } else {
      nextStep = {
        label: 'Rapport openen',
        sub: 'Alle stappen compleet',
        href: `/projects/${id}/report`,
        icon: FileText,
      };
    }

    const handleMaps = () => {
      const q = [project.address_line_1, project.postal_code, project.city].filter(Boolean).join(', ');
      if (!q) { toast({ title: 'Geen adres bekend' }); return; }
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`, '_blank');
    };

    const handleWerktekening = async () => {
      if (!werktekening) { toast({ title: 'Geen werktekening' }); return; }
      const { data } = await supabase.storage.from('project-files').createSignedUrl(werktekening.file_url, 3600);
      if (data?.signedUrl) window.open(data.signedUrl, '_blank');
      else toast({ title: 'Kon werktekening niet openen', variant: 'destructive' });
    };

    const openReport = () => {
      // Rapport mag altijd geopend worden — ontbrekende data wordt in het rapport weggelaten.
      navigate(`/projects/${id}/report`);
    };




    return (
      <>
        <div className="ios-detail-page animate-fade-in w-full max-w-full min-w-0">
          {/* Back row */}
          <button onClick={() => navigate('/projects')} className="ios-detail-back">
            <svg width="8" height="14" viewBox="0 0 8 14" fill="none"><path d="M7 1L1 7L7 13" stroke="hsl(var(--tenant-primary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span>Projecten</span>
          </button>

          <div className="ios-detail-scroll w-full max-w-full min-w-0">
            {/* 1. Project hub card */}
            <div className="rounded-3xl bg-card border border-border/40 shadow-sm overflow-hidden mb-4 max-w-full">
              <div className="px-5 pt-5 pb-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h1 className="text-[22px] font-display font-extrabold tracking-tight leading-tight text-foreground flex-1 min-w-0 break-words">
                    {project.project_name}
                  </h1>

                  <span className={cn(
                    'shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide',
                    statusTone === 'completed' && 'bg-[hsl(var(--status-completed))]/12 text-[hsl(var(--status-completed))]',
                    statusTone === 'inprogress' && 'bg-amber-500/12 text-amber-600',
                    statusTone === 'planned' && 'bg-muted/40 text-muted-foreground/60',
                  )}>
                    <span className={cn(
                      'w-1.5 h-1.5 rounded-full',
                      statusTone === 'completed' && 'bg-[hsl(var(--status-completed))]',
                      statusTone === 'inprogress' && 'bg-amber-500',
                      statusTone === 'planned' && 'bg-muted-foreground/40',
                    )} />
                    {statusLabel}
                  </span>
                </div>
                {project.project_number && (
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/50 mb-3">{project.project_number}</p>
                )}

                {(() => {
                  const locatie = [project.address_line_1, project.city].filter(Boolean).join(', ');
                  const hasAny = locatie || mobileDate || tech?.full_name;
                  if (!hasAny) return null;
                  return (
                    <div className="space-y-1.5">
                      {locatie && <MobileProjectMeta icon={MapPin} value={locatie} />}
                      {mobileDate && <MobileProjectMeta icon={Calendar} value={formatNlDate(mobileDate)} />}
                      {tech?.full_name && <MobileProjectMeta icon={User} value={tech.full_name} />}
                    </div>
                  );
                })()}
              </div>

              {/* Actions row */}
              <div className="grid grid-cols-3 border-t border-border/30">
                <button
                  onClick={handleMaps}
                  className="flex flex-col items-center gap-1 py-3 active:bg-foreground/[0.04] transition-colors"
                >
                  <MapIcon className="h-[18px] w-[18px] text-[hsl(var(--tenant-primary))]" />
                  <span className="text-[10px] font-semibold text-foreground/70">Kaart</span>
                </button>
                <button
                  onClick={handleWerktekening}
                  className="flex flex-col items-center gap-1 py-3 border-x border-border/30 active:bg-foreground/[0.04] transition-colors"
                >
                  <FileText className={cn('h-[18px] w-[18px]', werktekening ? 'text-[hsl(var(--tenant-primary))]' : 'text-muted-foreground/40')} />
                  <span className="text-[10px] font-semibold text-foreground/70">Werktekening</span>
                </button>
                <button
                  onClick={() => navigate(isFieldOnly ? `/projects/${id}/measurements?step=afronden` : `/projects/${id}/edit`)}
                  className="flex flex-col items-center gap-1 py-3 active:bg-foreground/[0.04] transition-colors"
                >
                  <Pencil className="h-[18px] w-[18px] text-[hsl(var(--tenant-primary))]" />
                  <span className="text-[10px] font-semibold text-foreground/70">{isFieldOnly ? 'Afronden' : 'Bewerken'}</span>
                </button>
              </div>
            </div>

            {/* 2. Volgende stap */}
            <button
              onClick={() => {
                if (nextStep.label === 'Rapport openen') openReport();
                else navigate(nextStep.href);
              }}
              className="w-full max-w-full flex items-center gap-3 rounded-2xl px-4 py-4 mb-4 bg-[hsl(var(--tenant-primary))] active:scale-[0.98] transition-all shadow-sm"
            >
              <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <nextStep.icon className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/70 mb-0.5">Volgende stap</p>
                <p className="text-[15px] font-bold text-white leading-tight break-words">{nextStep.label}</p>
                <p className="text-[11px] text-white/75 mt-0.5 break-words">{nextStep.sub}</p>
              </div>
              <ChevronRight className="h-5 w-5 text-white/70 shrink-0" />
            </button>


            {/* Voortgangsbalk */}
            <div className="px-1 mb-2 flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground/45">Voortgang</span>
              <span className="text-[11px] font-bold tabular-nums text-foreground/70">{tasksDone}/4 · {progressPct}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-muted/40 overflow-hidden mb-4">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  progressPct === 100 ? 'bg-[hsl(var(--status-completed))]' : 'bg-[hsl(var(--tenant-primary))]',
                )}
                style={{ width: `${progressPct}%` }}
              />
            </div>

            {/* 3. Taakblokken */}
            <div className="space-y-2.5 mb-4">
              <MobileTaskCard
                icon={Wrench}
                title="Meetapparatuur"
                sub={equip ? equip.device_name : 'Nog geen apparaat toegewezen'}
                done={equipmentComplete}
                onClick={() => navigate(equip?.id ? `/equipment/${equip.id}` : '/equipment')}
              />
              <MobileTaskCard
                icon={Activity}
                title="Metingen"
                sub={
                  measurementsComplete
                    ? `${electrodes.length} elektrodes · ${reportData?.stats.measurementCount || 0} metingen`
                    : hasSession ? 'Meting nog niet afgerond' : 'Nog niet gestart'
                }
                done={measurementsComplete}
                onClick={() => navigate(`/projects/${id}/measurements`)}
              />
              <MobileTaskCard
                icon={PenTool}
                title="Situatieschets"
                sub={diagramComplete ? 'Schets aanwezig' : 'Schets ontbreekt nog'}
                done={diagramComplete}
                onClick={() => navigate(`/projects/${id}/diagram`)}
              />
              <MobileTaskCard
                icon={FileText}
                title="Rapportage"
                sub={
                  reportComplete
                    ? (hasReportWarnings ? 'Klaar – met waarschuwingen' : 'Klaar om te openen')
                    : !diagramComplete ? 'Open – schets ontbreekt nog'
                    : !readiness.isReady ? `Open – ${readiness.blockers.length} aandachtspunt(en)`
                    : 'Open rapport'
                }
                done={reportComplete}
                onClick={openReport}
              />

            </div>

            {/* Projectbestanden */}
            {projectBestanden.length > 0 && (
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
                          <p className="text-[11px] text-muted-foreground/40 mt-0.5">Tik om te openen</p>
                        </div>
                        <Download className="h-4 w-4 text-muted-foreground/20 shrink-0" />
                      </button>
                      {i < projectBestanden.length - 1 && <div className="ios-dash-row-divider" />}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Project afronden CTA */}
            {project.status === 'planned' ? (
              <button
                className="ios-detail-cta-complete mt-4"
                onClick={() => handleStatusChange('completed')}
                disabled={updateMut.isPending || !mobileReportReady}
              >
                <CheckCircle2 className="h-5 w-5" />
                Project afronden
              </button>
            ) : (
              <button
                className="ios-detail-cta-reopen mt-4"
                onClick={() => handleStatusChange('planned')}
                disabled={updateMut.isPending}
              >
                <RotateCcw className="h-4 w-4" />
                Heropenen
              </button>
            )}

            {/* Danger zone */}
            <div className="ios-detail-card mt-4">
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
                <button className="ios-detail-confirm-delete" onClick={() => { setShowDeleteConfirm(false); handleDelete(); }}>
                  Verwijderen
                </button>
                <button className="ios-detail-confirm-cancel" onClick={() => setShowDeleteConfirm(false)}>
                  Annuleren
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Rapport-blokkade / waarschuwing sheet */}
        {showRapportBlock && (
          <div className="ios-detail-confirm-backdrop" onClick={() => setShowRapportBlock(false)}>
            <div className="ios-detail-confirm-sheet" onClick={e => e.stopPropagation()}>
              <div className="ios-detail-confirm-handle" />
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className={cn('h-5 w-5', mobileReportReady ? 'text-amber-500' : 'text-destructive')} />
                <h3 className="ios-detail-confirm-title" style={{ margin: 0 }}>
                  {mobileReportReady ? 'Rapport heeft waarschuwingen' : 'Rapport nog niet compleet'}
                </h3>
              </div>
              <p className="ios-detail-confirm-sub">
                {mobileReportReady
                  ? 'Je kunt het rapport openen, maar controleer onderstaande punten.'
                  : 'Vul eerst onderstaande punten aan voordat je het rapport opent.'}
              </p>

              {!diagramComplete && (
                <div className="mt-3 rounded-2xl bg-destructive/[0.04] border border-destructive/15 px-4 py-3 flex items-center gap-2.5">
                  <XCircle className="h-4 w-4 text-destructive shrink-0" />
                  <span className="text-[13px] text-foreground/85">Situatieschets ontbreekt</span>
                </div>
              )}

              {readiness.blockers.length > 0 && (
                <div className="mt-3 rounded-2xl bg-destructive/[0.04] divide-y divide-border/30 border border-destructive/15">
                  {readiness.blockers.map(b => (
                    <div key={b.code} className="flex items-center gap-2.5 px-4 py-3">
                      <XCircle className="h-4 w-4 text-destructive shrink-0" />
                      <span className="text-[13px] text-foreground/85">{b.label}</span>
                    </div>
                  ))}
                </div>
              )}

              {readiness.warnings.length > 0 && (
                <div className="mt-3 rounded-2xl bg-amber-500/[0.06] divide-y divide-border/30 border border-amber-500/20">
                  {readiness.warnings.map(w => (
                    <div key={w.code} className="flex items-center gap-2.5 px-4 py-3">
                      <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                      <span className="text-[13px] text-foreground/85">{w.label}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="ios-detail-confirm-actions mt-4">
                {!mobileReportReady ? (
                  <button
                    className="ios-detail-confirm-delete"
                    style={{ background: 'hsl(var(--tenant-primary))' }}
                    onClick={() => { setShowRapportBlock(false); navigate(sheetPrimary.href); }}
                  >
                    {sheetPrimary.label}
                  </button>
                ) : (
                  <button
                    className="ios-detail-confirm-delete"
                    style={{ background: 'hsl(var(--tenant-primary))' }}
                    onClick={() => { setShowRapportBlock(false); navigate(`/projects/${id}/report`); }}
                  >
                    Toch openen
                  </button>
                )}
                <button className="ios-detail-confirm-cancel" onClick={() => setShowRapportBlock(false)}>
                  Sluiten
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
            {session?.measurement_date && (
              <DInfoRow label="Meetdatum (rapport)" value={formatNlDate(session.measurement_date)} highlight />
            )}
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

/* ── Mobile helpers ── */

function MobileProjectMeta({ icon: Icon, value }: { icon: React.ComponentType<{ className?: string }>; value: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon className="h-4 w-4 text-muted-foreground/45 shrink-0" />
      <span className="text-[13px] text-foreground/80 truncate">{value}</span>
    </div>
  );
}

function MobileTaskCard({
  icon: Icon,
  title,
  sub,
  done,
  disabled = false,
  onClick,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  sub: string;
  done: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 rounded-2xl px-4 py-3.5 border transition-all text-left',
        disabled
          ? 'bg-muted/20 border-border/30 opacity-60'
          : 'bg-card border-border/40 active:scale-[0.98] active:bg-foreground/[0.02]',
      )}
    >
      <div className={cn(
        'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
        done
          ? 'bg-[hsl(var(--status-completed))]/12'
          : disabled
            ? 'bg-muted/40'
            : 'bg-[hsl(var(--tenant-primary)/0.10)]',
      )}>
        <Icon className={cn(
          'h-[18px] w-[18px]',
          done
            ? 'text-[hsl(var(--status-completed))]'
            : disabled
              ? 'text-muted-foreground/40'
              : 'text-[hsl(var(--tenant-primary))]',
        )} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-bold text-foreground leading-tight">{title}</p>
        <p className="text-[11px] text-muted-foreground/55 mt-0.5 truncate">{sub}</p>
      </div>
      {done ? (
        <CheckCircle2 className="h-5 w-5 text-[hsl(var(--status-completed))] shrink-0" />
      ) : (
        <ChevronRight className={cn('h-4 w-4 shrink-0', disabled ? 'text-muted-foreground/25' : 'text-muted-foreground/40')} />
      )}
    </button>
  );
}
