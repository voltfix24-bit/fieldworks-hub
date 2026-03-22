import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp, Pencil, WifiOff, AlertTriangle, Check, X as XIcon } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useProject } from '@/hooks/use-projects';
import { useMeasurementSession, useCreateMeasurementSession, useUpdateMeasurementSession } from '@/hooks/use-measurement-sessions';
import { useElectrodes, useCreateElectrode, useUpdateElectrode } from '@/hooks/use-electrodes';
import { usePens, useCreatePen, useUpdatePen, useDeletePen } from '@/hooks/use-pens';
import { useCreateDepthMeasurement, useUpdateDepthMeasurement, useDeleteDepthMeasurement } from '@/hooks/use-depth-measurements';
import { useClients } from '@/hooks/use-clients';
import { useTechnicians } from '@/hooks/use-technicians';
import { useEquipmentList } from '@/hooks/use-equipment';
import { useAttachments, uploadMeasurementPhoto } from '@/hooks/use-attachments';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { GroundingIcon, GroundingLoader } from '@/components/measurement/GroundingIcon';
import { formatNlDate } from '@/lib/nl-date';
import { cn } from '@/lib/utils';

import { WizardStepIndicator } from '@/components/measurement/wizard/WizardStepIndicator';
import { StickyActionBar } from '@/components/measurement/wizard/StickyActionBar';
import { MeasurementStep } from '@/components/measurement/wizard/steps/MeasurementStep';
import { PhotoStep } from '@/components/measurement/wizard/steps/PhotoStep';
import { NextActionStep } from '@/components/measurement/wizard/steps/NextActionStep';
import { SketchStep } from '@/components/measurement/wizard/steps/SketchStep';
import { SetupStep } from '@/components/measurement/wizard/steps/SetupStep';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const PREDEFINED_DEPTHS = [3, 6, 9, 12, 15, 18, 21, 24, 27, 30];

const WIZARD_STEPS = [
  { label: 'Metingen', key: 'measurements' },
  { label: "Foto's", key: 'photos' },
  { label: 'Volgende', key: 'next' },
];

export default function MeasurementWorkspace() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const isMobile = useIsMobile();
  const tenantId = profile?.tenant_id || '';
  const { isOnline } = useOnlineStatus();

  const { data: project, isLoading: projectLoading } = useProject(id);
  const { data: session, isLoading: sessionLoading } = useMeasurementSession(id);
  const createSession = useCreateMeasurementSession();
  const updateSession = useUpdateMeasurementSession();

  const { data: electrodes = [] } = useElectrodes(session?.id);
  const createElectrode = useCreateElectrode();
  const updateElectrode = useUpdateElectrode();

  const { data: clients = [] } = useClients();
  const { data: technicians = [] } = useTechnicians();
  const { data: equipment = [] } = useEquipmentList();

  const [activeElectrodeId, setActiveElectrodeId] = useState<string | null>(null);
  const activeElectrode = electrodes.find((e: any) => e.id === activeElectrodeId);
  const { data: pens = [] } = usePens(activeElectrodeId || undefined);

  const [activePenId, setActivePenId] = useState<string | null>(null);
  const activePen = pens.find((p: any) => p.id === activePenId);

  // Warning count from MeasurementStep (reported via callback)
  const [warningCount, setWarningCount] = useState(0);
  const [rvMissing, setRvMissing] = useState(false);

  const createPen = useCreatePen();
  const updatePen = useUpdatePen();
  const deletePen = useDeletePen();

  const createMeasurement = useCreateDepthMeasurement();
  const updateMeasurement = useUpdateDepthMeasurement();
  const deleteMeasurement = useDeleteDepthMeasurement();

  const [step, setStep] = useState(0);
  const [showSketch, setShowSketch] = useState(false);
  const [showContextEdit, setShowContextEdit] = useState(false);
  const [measurementDate, setMeasurementDate] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedTechnician, setSelectedTechnician] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState('');
  const [notes, setNotes] = useState('');
  const [targetValue, setTargetValue] = useState('3.00');

  const [uploading, setUploading] = useState(false);
  const [autoInitDone, setAutoInitDone] = useState(false);
  const [autoInitError, setAutoInitError] = useState(false);
  const [progressionWarningDismissed, setProgressionWarningDismissed] = useState(false);
  const [handtekeningB64, setHandtekeningB64] = useState<string | null>(null);
  const [penWaarschuwingZichtbaar, setPenWaarschuwingZichtbaar] = useState(false);
  const depthsInitRef = useRef<Set<string>>(new Set());

  // DEEL 1 — Data loss prevention: blur active input on visibility change / beforeunload
  useEffect(() => {
    const blurActief = () => {
      const actief = document.activeElement as HTMLElement;
      if (actief && (actief.tagName === 'INPUT' || actief.tagName === 'TEXTAREA')) {
        actief.blur();
      }
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') blurActief();
    };
    const handleUnload = () => blurActief();

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleUnload);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, []);

  // DEEL 11 — Scroll position per step
  const scrollPosities = useRef<Record<number, number>>({});
  const handleStapWissel = (nieuweStap: number) => {
    scrollPosities.current[step] = window.scrollY;
    setStep(nieuweStap);
  };
  useEffect(() => {
    const opgeslagen = scrollPosities.current[step];
    if (opgeslagen !== undefined) {
      setTimeout(() => window.scrollTo({ top: opgeslagen, behavior: 'instant' as ScrollBehavior }), 50);
    } else {
      window.scrollTo({ top: 0 });
    }
  }, [step]);

  // DEEL 9 — Context check on load
  useEffect(() => {
    if (!session) return;
    const ontbreekt = !session.client_id || !session.technician_id || !session.equipment_id;
    if (ontbreekt) {
      setShowContextEdit(true);
    }
  }, [session?.id]);

  // DEEL 13 — Exit confirmation
  const [toonAfsluitBevestiging, setToonAfsluitBevestiging] = useState(false);

  // Sync form fields from session or project
  useEffect(() => {
    if (session) {
      setMeasurementDate(session.measurement_date || '');
      setSelectedClient(session.client_id || '');
      setSelectedTechnician(session.technician_id || '');
      setSelectedEquipment(session.equipment_id || '');
      setNotes(session.measurement_notes || '');
    } else if (project) {
      setMeasurementDate(project.planned_date || new Date().toISOString().split('T')[0]);
      setSelectedClient(project.client_id || '');
      setSelectedTechnician(project.technician_id || '');
      setSelectedEquipment(project.equipment_id || '');
      setTargetValue(String((project as any).target_value || '3.00'));
    }
  }, [session?.id, project?.id]);

  // Track active electrode
  useEffect(() => {
    if (electrodes.length > 0 && !electrodes.find((e: any) => e.id === activeElectrodeId)) {
      setActiveElectrodeId(electrodes[electrodes.length - 1].id);
    }
  }, [electrodes]);

  // Track active pen
  useEffect(() => {
    if (pens.length > 0 && !pens.find((p: any) => p.id === activePenId)) {
      setActivePenId(pens[pens.length - 1].id);
    }
  }, [pens]);

  // Auto-initialize: create session + electrode 1 + pen 1 + depths if nothing exists
  useEffect(() => {
    if (autoInitDone || !project || sessionLoading || projectLoading) return;
    if (session && electrodes.length > 0) {
      setAutoInitDone(true);
      return;
    }
    if (!session && !createSession.isPending) {
      setAutoInitDone(true);
      (async () => {
        try {
          const payload = {
            measurement_date: project.planned_date || new Date().toISOString().split('T')[0],
            client_id: project.client_id || null,
            technician_id: project.technician_id || null,
            equipment_id: project.equipment_id || null,
            tenant_id: tenantId,
            project_id: id,
          };
          const sessionData = await createSession.mutateAsync(payload);
          const newElectrode = await createElectrode.mutateAsync({
            tenant_id: tenantId, project_id: id,
            measurement_session_id: sessionData.id,
            electrode_code: 'Elektrode 1', sort_order: 0,
          });
          setActiveElectrodeId(newElectrode.id);
          const newPen = await createPen.mutateAsync({
            tenant_id: tenantId, project_id: id!,
            measurement_session_id: sessionData.id,
            electrode_id: newElectrode.id,
            pen_code: 'Pen 1', sort_order: 0,
          });
          setActivePenId(newPen.id);
          initializeDepthRows(newPen.id, newPen);
        } catch (e) {
          console.error('Auto-init failed', e);
          setAutoInitError(true);
          setAutoInitDone(false);
        }
      })();
    }
  }, [project, session, sessionLoading, projectLoading, autoInitDone]);

  const initializeDepthRows = useCallback((penId: string, pen: any) => {
    if (depthsInitRef.current.has(penId)) return;
    depthsInitRef.current.add(penId);
    PREDEFINED_DEPTHS.forEach((d, i) => {
      createMeasurement.mutate({
        tenant_id: tenantId, project_id: pen.project_id,
        measurement_session_id: pen.measurement_session_id,
        electrode_id: pen.electrode_id,
        pen_id: penId, depth_meters: d, resistance_value: 0, sort_order: i,
      });
    });
  }, [tenantId, createMeasurement]);

  const handleSaveContext = async () => {
    if (!session) return;
    await updateSession.mutateAsync({
      id: session.id,
      measurement_date: measurementDate || null,
      client_id: selectedClient || null,
      technician_id: selectedTechnician || null,
      equipment_id: selectedEquipment || null,
      measurement_notes: notes || null,
    });
    setShowContextEdit(false);
  };

  const handleAddNewPen = async () => {
    if (!activeElectrode) return;
    const newPen = await createPen.mutateAsync({
      tenant_id: tenantId, project_id: activeElectrode.project_id,
      measurement_session_id: activeElectrode.measurement_session_id,
      electrode_id: activeElectrode.id,
      pen_code: `Pen ${pens.length + 1}`, sort_order: pens.length,
    });
    setActivePenId(newPen.id);
    initializeDepthRows(newPen.id, newPen);

    // Als dit de tweede pen is → elektrode wordt RV (gekoppeld)
    if (pens.length === 1) {
      await updateElectrode.mutateAsync({
        id: activeElectrode.id,
        is_coupled: true,
        ra_value: null,
      });
    }

    setTimeout(() => {
      const el = document.getElementById(`pen-section-${newPen.id}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
  };

  const handleDeletePen = async (penId: string) => {
    await deletePen.mutateAsync({ id: penId, electrodeId: activeElectrodeId! });
    if (activePenId === penId) {
      const overige = pens.filter((p: any) => p.id !== penId);
      if (overige.length > 0) setActivePenId(overige[0].id);
    }
    toast({ description: 'Pen verwijderd' });
  };

  const handlePenToevoegenMetCheck = () => {
    handleAddNewPen();
  };

  const handleAddNewElectrode = async () => {
    if (!session) return;
    const newElectrode = await createElectrode.mutateAsync({
      tenant_id: tenantId, project_id: id,
      measurement_session_id: session.id,
      electrode_code: `Elektrode ${electrodes.length + 1}`, sort_order: electrodes.length,
    });
    setActiveElectrodeId(newElectrode.id);
    const newPen = await createPen.mutateAsync({
      tenant_id: tenantId, project_id: id!,
      measurement_session_id: session.id,
      electrode_id: newElectrode.id,
      pen_code: 'Pen 1', sort_order: 0,
    });
    setActivePenId(newPen.id);
    initializeDepthRows(newPen.id, newPen);
    handleStapWissel(0); // back to measurements
  };

  // DEEL 7 — Photo upload with retry
  const [lokaleFotoPreview, setLokaleFotoPreview] = useState<Record<string, string>>({});

  const handlePhotoUpload = async (type: 'display_photo_url' | 'overview_photo_url', file: File) => {
    const firstPen = pens[0];
    if (!firstPen) return;
    setUploading(true);

    const localUrl = URL.createObjectURL(file);
    setLokaleFotoPreview(prev => ({ ...prev, [type]: localUrl }));

    let pogingen = 0;
    const maxPogingen = 3;

    while (pogingen < maxPogingen) {
      try {
        const url = await uploadMeasurementPhoto(file, tenantId, firstPen.project_id);
        await updatePen.mutateAsync({ id: firstPen.id, [type]: url });
        URL.revokeObjectURL(localUrl);
        setLokaleFotoPreview(prev => {
          const nieuw = { ...prev };
          delete nieuw[type];
          return nieuw;
        });
        toast({ description: 'Foto opgeslagen ✓', duration: 1500 });
        break;
      } catch (err) {
        pogingen++;
        if (pogingen === maxPogingen) {
          toast({
            variant: 'destructive',
            title: 'Foto upload mislukt',
            description: 'Controleer je verbinding en probeer opnieuw.',
            duration: 6000,
          });
        } else {
          await new Promise(r => setTimeout(r, 1000 * pogingen));
        }
      }
    }
    setUploading(false);
  };

  const recalcRa = useCallback((electrodeId: string, updatedMeasurements: any[]) => {
    const validValues = updatedMeasurements.filter((m: any) => m.resistance_value > 0).map((m: any) => m.resistance_value);
    const lowestResistance = validValues.length > 0 ? Math.min(...validValues) : null;
    updateElectrode.mutate({ id: electrodeId, ra_value: lowestResistance, rv_value: null });
  }, [updateElectrode]);

  if (projectLoading || sessionLoading) return (
    <div className="flex justify-center py-20"><GroundingLoader /></div>
  );
  if (autoInitError) return (
    <div className="flex justify-center py-20">
      <div className="rounded-2xl border border-destructive/20 bg-destructive/[0.04] p-6 text-center max-w-sm mx-auto">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="mx-auto mb-3 text-destructive">
          <path d="M12 2L22 20H2L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 9V13M12 17H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <p className="text-[14px] font-semibold text-foreground mb-1">Initialisatie mislukt</p>
        <p className="text-[12px] text-muted-foreground mb-4">Controleer je verbinding en probeer opnieuw.</p>
        <button
          onClick={() => { setAutoInitError(false); setAutoInitDone(false); }}
          className="rounded-xl px-5 py-2.5 text-[13px] font-semibold text-white bg-[hsl(var(--tenant-primary,var(--primary)))] active:scale-[0.97] transition-transform"
        >
          Opnieuw proberen
        </button>
      </div>
    </div>
  );
  if (!project) return (
    <div className="text-center py-16">
      <p className="text-[13px] text-muted-foreground">Project niet gevonden</p>
    </div>
  );

  // DEEL 13 — Exit confirmation handler
  const handleBack = () => {
    const heeftInvoer = electrodes.length > 0;
    if (heeftInvoer) {
      setToonAfsluitBevestiging(true);
    } else {
      navigate(`/projects/${id}`);
    }
  };

  const clientName = clients.find((c: any) => c.id === (session?.client_id || selectedClient))?.company_name;
  const techName = technicians.find((t: any) => t.id === (session?.technician_id || selectedTechnician))?.full_name;
  const equipName = equipment.find((e: any) => e.id === (session?.equipment_id || selectedEquipment))?.device_name;
  const displayStep = showSketch ? -1 : step;

  // DEEL 9 — Context incomplete indicator
  const contextOnvolledig = !selectedClient || !selectedTechnician || !selectedEquipment;

  // ═══════════════════════════════════════════════
  // MOBILE: fullscreen work mode
  // ═══════════════════════════════════════════════
  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col animate-fade-in overflow-x-hidden max-w-full">
        {/* ─── iOS sticky top nav ─── */}
        <div className="ios-wizard-topnav shrink-0">
          <div className="ios-wizard-nav-row">
            <button
              onClick={handleBack}
              className="ios-wizard-nav-back"
            >
              <svg width="8" height="14" viewBox="0 0 8 14" fill="none"><path d="M7 1L1 7L7 13" stroke="hsl(var(--tenant-primary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <span>{project.project_name}</span>
            </button>
            {activeElectrode && !showSketch && (
              <span className="ios-wizard-nav-badge max-w-[160px] truncate bg-[hsl(var(--tenant-primary)/0.12)] text-[hsl(var(--tenant-primary))] font-bold px-2.5 py-1 rounded-lg text-[11px]">
                {activeElectrode.electrode_code}
                {activePen && step === 0 ? ` · ${activePen.pen_code}` : ''}
              </span>
            )}
          </div>

          {/* Step tabs */}
          {!showSketch && (
            <div className="ios-wizard-step-tabs">
              {WIZARD_STEPS.map((s, i) => (
                <button
                  key={s.key}
                  className={cn(
                    'ios-wizard-step-tab',
                    i === step && 'active',
                    i < step && 'done',
                  )}
                  onClick={() => {
                    if (i <= step) { setShowSketch(false); handleStapWissel(i); setProgressionWarningDismissed(false); }
                  }}
                >
                  {i < step && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 6L5 8.5L9.5 3.5" stroke="hsl(var(--status-completed))" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* DEEL 5 — Electrode progress bar */}
        {electrodes.length > 1 && !showSketch && (
          <div className="shrink-0 flex items-center gap-1.5 px-4 py-2 overflow-x-auto border-b border-border/10">
            {electrodes.map((e: any) => {
              const klaar = e.ra_value != null || e.rv_value != null;
              const voldoet = klaar && ((e.ra_value ?? e.rv_value) <= (e.target_value ?? 999));
              const actief = e.id === activeElectrodeId;
              return (
                <button
                  key={e.id}
                  onMouseDown={(ev) => {
                    ev.preventDefault();
                    (document.activeElement as HTMLElement)?.blur();
                    setActiveElectrodeId(e.id);
                    handleStapWissel(0);
                  }}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold whitespace-nowrap shrink-0 transition-all duration-150 active:scale-[0.96]',
                    actief
                      ? 'bg-[hsl(var(--tenant-primary))] text-white shadow-sm'
                      : klaar && voldoet
                        ? 'bg-green-500/10 text-green-600 border border-green-500/20'
                        : klaar && !voldoet
                          ? 'bg-destructive/8 text-destructive border border-destructive/20'
                          : 'bg-muted/30 text-muted-foreground/60'
                  )}
                >
                  {klaar && voldoet && !actief && <Check className="h-3 w-3" />}
                  {klaar && !voldoet && !actief && <XIcon className="h-3 w-3" />}
                  {e.electrode_code}
                </button>
              );
            })}
          </div>
        )}

        {/* ─── Offline banner ─── */}
        {!isOnline && (
          <div className="shrink-0 flex items-center gap-2 px-4 py-2 bg-amber-500/10 border-b border-amber-400/20">
            <WifiOff className="h-3.5 w-3.5 text-amber-600 shrink-0" />
            <p className="text-[11px] text-amber-700 font-medium">Geen verbinding — metingen worden lokaal opgeslagen en later gesynchroniseerd</p>
          </div>
        )}

        {/* ─── Scrollable content ─── */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 pt-3 pb-2 overflow-x-hidden measurement-scroll-container" style={{ maxWidth: '100vw' }} key={showSketch ? 'sketch' : step}>
          <div className="wizard-step-enter">

            {/* Project context block — shown above measurements */}
            {step === 0 && !showSketch && (
              <MobileContextBlock
                clientName={clientName}
                techName={techName}
                equipName={equipName}
                date={measurementDate}
                open={showContextEdit}
                onToggle={() => setShowContextEdit(!showContextEdit)}
                onSave={handleSaveContext}
                saving={updateSession.isPending}
                measurementDate={measurementDate} setMeasurementDate={setMeasurementDate}
                selectedClient={selectedClient} setSelectedClient={setSelectedClient}
                selectedTechnician={selectedTechnician} setSelectedTechnician={setSelectedTechnician}
                selectedEquipment={selectedEquipment} setSelectedEquipment={setSelectedEquipment}
                clients={clients} technicians={technicians} equipment={equipment}
                onvolledig={contextOnvolledig}
              />
            )}

            {step === 0 && !showSketch && activeElectrode && (
              <MeasurementStep
                electrode={activeElectrode}
                pens={pens}
                tenantId={tenantId}
                onUpdateElectrode={(updates) => updateElectrode.mutate({ id: activeElectrode.id, ...updates })}
                onAddPen={handlePenToevoegenMetCheck}
                onDeletePen={handleDeletePen}
                recalcRa={recalcRa}
                depthsInitRef={depthsInitRef}
                initializeDepthRows={initializeDepthRows}
                onWarningCountChange={setWarningCount}
                onRvMissingChange={setRvMissing}
                compact
              />
            )}

            {step === 1 && !showSketch && activeElectrode && pens.length > 0 && (
              <PhotoStep
                electrodeCode={activeElectrode.electrode_code}
                displayPhotoUrl={lokaleFotoPreview['display_photo_url'] || pens[0]?.display_photo_url ?? null}
                overviewPhotoUrl={lokaleFotoPreview['overview_photo_url'] || pens[0]?.overview_photo_url ?? null}
                onUpload={(type, file) => handlePhotoUpload(type, file)}
                onRemove={(type) => updatePen.mutate({ id: pens[0].id, [type]: null })}
                uploading={uploading}
                compact
              />
            )}

            {step === 2 && !showSketch && (
              <NextActionStep
                onAddElectrode={handleAddNewElectrode}
                onGoToSketch={() => setShowSketch(true)}
                onSave={() => navigate(`/projects/${id}`)}
                nextElectrodeNumber={electrodes.length + 1}
                onHandtekeningChange={setHandtekeningB64}
                compact
              />
            )}

            {showSketch && (
              <SketchStep projectId={id!} tenantId={tenantId} sessionId={session?.id} />
            )}
          </div>
        </div>

        {/* ─── iOS bottom bar ─── */}
        {step < 2 && !showSketch && (
          <div className="shrink-0">
            {warningCount > 0 && step === 0 && !progressionWarningDismissed && (
              <div className="ios-wizard-warning">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1L15 14H1L8 1Z" stroke="hsl(40, 90%, 50%)" strokeWidth="1.5" fill="hsl(40, 90%, 50%, 0.08)"/><path d="M8 6V9M8 11.5V11" stroke="hsl(40, 90%, 50%)" strokeWidth="1.5" strokeLinecap="round"/></svg>
                <span className="ios-wizard-warning-text">
                  {warningCount} {warningCount === 1 ? 'meetwaarde wijkt' : 'meetwaarden wijken'} af
                </span>
                <button className="ios-wizard-warning-btn" onClick={() => { setProgressionWarningDismissed(true); handleStapWissel(step + 1); }}>
                  Doorgaan
                </button>
              </div>
            )}
            {/* DEEL 6 — RV missing warning in bottom bar */}
            {rvMissing && step === 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/[0.06] border-t border-amber-500/20">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                  Vul de RV-waarde in om door te gaan — lees de waarde af van uw meetapparaat
                </p>
              </div>
            )}
            <div className="ios-wizard-bottom-bar">
              {step > 0 ? (
                <button className="ios-wizard-btn-back" onMouseDown={(e) => {
                  e.preventDefault();
                  (document.activeElement as HTMLElement)?.blur();
                  setTimeout(() => { handleStapWissel(Math.max(0, step - 1)); setProgressionWarningDismissed(false); }, 50);
                }}>
                  <svg width="8" height="14" viewBox="0 0 8 14" fill="none"><path d="M7 1L1 7L7 13" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Vorige
                </button>
              ) : <div />}
              <button
                className={cn('ios-wizard-btn-next', rvMissing && step === 0 && 'opacity-40 pointer-events-none')}
                onMouseDown={(e) => {
                  e.preventDefault();
                  (document.activeElement as HTMLElement)?.blur();
                  if (step === 0 && warningCount > 0 && !progressionWarningDismissed) return;
                  if (step === 0 && rvMissing) return;
                  if (navigator.vibrate) navigator.vibrate([6, 30, 6]);
                  setTimeout(() => { setProgressionWarningDismissed(false); handleStapWissel(step + 1); }, 50);
                }}
              >
                Volgende
                <svg width="8" height="14" viewBox="0 0 8 14" fill="none"><path d="M1 1L7 7L1 13" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>
          </div>
        )}

        {showSketch && (
          <div className="shrink-0">
            <div className="ios-wizard-bottom-bar">
              <button className="ios-wizard-btn-back" onClick={() => setShowSketch(false)}>
                <svg width="8" height="14" viewBox="0 0 8 14" fill="none"><path d="M7 1L1 7L7 13" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Vorige
              </button>
              <button className="ios-wizard-btn-next" onClick={() => { setShowSketch(false); navigate(`/projects/${id}`); }}>
                Opslaan
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>
          </div>
        )}

        {/* DEEL 13 — Exit confirmation dialog */}
        {toonAfsluitBevestiging && (
          <div className="fixed inset-0 z-[500] bg-black/40 backdrop-blur-sm flex items-end justify-center p-4">
            <div className="w-full max-w-sm bg-background rounded-3xl p-5 shadow-xl">
              <h3 className="text-[17px] font-bold text-foreground mb-1">Meting verlaten?</h3>
              <p className="text-[14px] text-muted-foreground/60 mb-5">
                Alle ingevoerde metingen zijn automatisch opgeslagen. Je kunt later verdergaan.
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => { setToonAfsluitBevestiging(false); navigate(`/projects/${id}`); }}
                  className="w-full py-3.5 rounded-2xl bg-[hsl(var(--tenant-primary))] text-white font-semibold text-[15px] active:scale-[0.98] transition-all"
                >
                  Ja, verlaten
                </button>
                <button
                  onClick={() => setToonAfsluitBevestiging(false)}
                  className="w-full py-3.5 rounded-2xl bg-muted/30 text-muted-foreground font-semibold text-[15px] active:scale-[0.98] transition-all"
                >
                  Verder meten
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════
  // DESKTOP layout
  // ═══════════════════════════════════════════════
  const DESKTOP_STEPS = [
    { label: 'Opstelling', key: 'setup' },
    ...WIZARD_STEPS,
  ];
  const desktopStep = showSketch ? -1 : (step + 1); // offset by 1 for setup

  return (
    <div className="animate-fade-in max-w-2xl mx-auto px-1 sm:px-4">
      <div className="flex items-center gap-2 mb-4 pt-1">
        <button
          onClick={handleBack}
          className="h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-foreground shrink-0 rounded-lg active:scale-95 transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-foreground truncate flex items-center gap-1.5 tracking-tight text-[15px]">
            <GroundingIcon size={13} className="text-primary shrink-0" />
            {project.project_name}
          </h1>
          <span className="text-[11px] text-muted-foreground font-mono tracking-wide">{project.project_number}</span>
        </div>
      </div>

      {/* ─── Offline banner (desktop) ─── */}
      {!isOnline && (
        <div className="flex items-center gap-2 px-4 py-2.5 mb-4 rounded-xl bg-amber-500/10 border border-amber-400/20">
          <WifiOff className="h-3.5 w-3.5 text-amber-600 shrink-0" />
          <p className="text-[12px] text-amber-700 font-medium">Geen verbinding — metingen worden lokaal opgeslagen en later gesynchroniseerd</p>
        </div>
      )}

      <div className="mb-5 -mx-1 sm:mx-0">
        <WizardStepIndicator
          steps={DESKTOP_STEPS}
          currentStep={desktopStep}
          onStepClick={(i) => { setShowSketch(false); handleStapWissel(i === 0 ? -1 : i - 1); }}
        />
      </div>

      {/* DEEL 5 — Electrode progress bar (desktop) */}
      {electrodes.length > 1 && !showSketch && (
        <div className="flex items-center gap-1.5 mb-4 overflow-x-auto">
          {electrodes.map((e: any) => {
            const klaar = e.ra_value != null || e.rv_value != null;
            const voldoet = klaar && ((e.ra_value ?? e.rv_value) <= (e.target_value ?? 999));
            const actief = e.id === activeElectrodeId;
            return (
              <button
                key={e.id}
                onClick={() => { setActiveElectrodeId(e.id); handleStapWissel(0); }}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold whitespace-nowrap shrink-0 transition-all',
                  actief
                    ? 'bg-[hsl(var(--tenant-primary))] text-white shadow-sm'
                    : klaar && voldoet
                      ? 'bg-green-500/10 text-green-600 border border-green-500/20'
                      : klaar && !voldoet
                        ? 'bg-destructive/8 text-destructive border border-destructive/20'
                        : 'bg-muted/30 text-muted-foreground/60'
                )}
              >
                {klaar && voldoet && !actief && <Check className="h-3 w-3" />}
                {klaar && !voldoet && !actief && <XIcon className="h-3 w-3" />}
                {e.electrode_code}
              </button>
            );
          })}
        </div>
      )}

      <div className="min-h-[50vh] wizard-step-enter" key={showSketch ? 'sketch' : step}>
        {step === -1 && !showSketch && (
          <SetupStep
            measurementDate={measurementDate} setMeasurementDate={setMeasurementDate}
            selectedClient={selectedClient} setSelectedClient={setSelectedClient}
            selectedTechnician={selectedTechnician} setSelectedTechnician={setSelectedTechnician}
            selectedEquipment={selectedEquipment} setSelectedEquipment={setSelectedEquipment}
            notes={notes} setNotes={setNotes}
            targetValue={targetValue} onTargetValueChange={setTargetValue}
            clients={clients} technicians={technicians} equipment={equipment}
          />
        )}

        {step === 0 && !showSketch && activeElectrode && (
          <MeasurementStep
            electrode={activeElectrode}
            pens={pens}
            tenantId={tenantId}
            onUpdateElectrode={(updates) => updateElectrode.mutate({ id: activeElectrode.id, ...updates })}
            onAddPen={handlePenToevoegenMetCheck}
            onDeletePen={handleDeletePen}
            recalcRa={recalcRa}
            depthsInitRef={depthsInitRef}
            initializeDepthRows={initializeDepthRows}
            onRvMissingChange={setRvMissing}
          />
        )}

        {step === 1 && !showSketch && activeElectrode && pens.length > 0 && (
          <PhotoStep
            electrodeCode={activeElectrode.electrode_code}
            displayPhotoUrl={lokaleFotoPreview['display_photo_url'] || pens[0]?.display_photo_url ?? null}
            overviewPhotoUrl={lokaleFotoPreview['overview_photo_url'] || pens[0]?.overview_photo_url ?? null}
            onUpload={(type, file) => handlePhotoUpload(type, file)}
            onRemove={(type) => updatePen.mutate({ id: pens[0].id, [type]: null })}
            uploading={uploading}
          />
        )}

        {step === 2 && !showSketch && (
          <NextActionStep
            onAddElectrode={handleAddNewElectrode}
            onGoToSketch={() => setShowSketch(true)}
            onSave={() => navigate(`/projects/${id}`)}
            nextElectrodeNumber={electrodes.length + 1}
            onHandtekeningChange={setHandtekeningB64}
          />
        )}

        {showSketch && (
          <SketchStep projectId={id!} tenantId={tenantId} sessionId={session?.id} />
        )}
      </div>

      {step < 2 && !showSketch && (
        <StickyActionBar
          showPrev={step >= 0}
          onPrev={() => handleStapWissel(step - 1)}
          onNext={step === -1 ? handleSaveContext : () => { if (step === 0 && rvMissing) return; handleStapWissel(step + 1); }}
          nextLabel={step === -1 ? 'Opslaan & verder' : 'Volgende'}
          nextDisabled={step === 0 && rvMissing}
          nextLoading={updateSession.isPending || createSession.isPending}
        />
      )}

      {showSketch && (
        <StickyActionBar
          showPrev
          onPrev={() => setShowSketch(false)}
          onNext={() => { setShowSketch(false); navigate(`/projects/${id}`); }}
          nextLabel="Opslaan"
        />
      )}

      {/* DEEL 13 — Exit confirmation dialog (desktop) */}
      {toonAfsluitBevestiging && (
        <div className="fixed inset-0 z-[500] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-background rounded-3xl p-6 shadow-xl">
            <h3 className="text-[17px] font-bold text-foreground mb-1">Meting verlaten?</h3>
            <p className="text-[14px] text-muted-foreground/60 mb-5">
              Alle ingevoerde metingen zijn automatisch opgeslagen. Je kunt later verdergaan.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => { setToonAfsluitBevestiging(false); navigate(`/projects/${id}`); }}
                className="w-full py-3.5 rounded-2xl bg-[hsl(var(--tenant-primary))] text-white font-semibold text-[15px] active:scale-[0.98] transition-all"
              >
                Ja, verlaten
              </button>
              <button
                onClick={() => setToonAfsluitBevestiging(false)}
                className="w-full py-3.5 rounded-2xl bg-muted/30 text-muted-foreground font-semibold text-[15px] active:scale-[0.98] transition-all"
              >
                Verder meten
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Mobile context block ───────────────────────────────
interface MobileContextBlockProps {
  clientName?: string;
  techName?: string;
  equipName?: string;
  date: string;
  open: boolean;
  onToggle: () => void;
  onSave: () => void;
  saving: boolean;
  measurementDate: string; setMeasurementDate: (v: string) => void;
  selectedClient: string; setSelectedClient: (v: string) => void;
  selectedTechnician: string; setSelectedTechnician: (v: string) => void;
  selectedEquipment: string; setSelectedEquipment: (v: string) => void;
  clients: any[]; technicians: any[]; equipment: any[];
  onvolledig?: boolean;
}

function MobileContextBlock({
  clientName, techName, equipName, date, open, onToggle, onSave, saving,
  measurementDate, setMeasurementDate,
  selectedClient, setSelectedClient,
  selectedTechnician, setSelectedTechnician,
  selectedEquipment, setSelectedEquipment,
  clients, technicians, equipment,
  onvolledig,
}: MobileContextBlockProps) {
  const summaryItems = [
    clientName, techName, equipName, date ? formatNlDate(date) : null,
  ].filter(Boolean);

  return (
    <div className="ios-wizard-context-block mb-3">
      <button
        onClick={onToggle}
        className="ios-wizard-context-trigger"
      >
        <span className="ios-wizard-context-summary">
          {summaryItems.length > 0 ? summaryItems.join(' · ') : 'Meetgegevens instellen'}
        </span>
        <div className="flex items-center gap-1.5">
          {onvolledig && (
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
          )}
          <div className="ios-wizard-context-edit">
            <Pencil className="h-3 w-3" />
          </div>
        </div>
      </button>

      {open && (
        <div className="px-4 pb-3 pt-2 space-y-2.5 border-t border-border/10 animate-in slide-in-from-top-1 duration-150">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] font-semibold text-muted-foreground/50 uppercase tracking-wide w-24 shrink-0">Datum</span>
            <Input type="date" value={measurementDate} onChange={e => setMeasurementDate(e.target.value)} className="flex-1 h-9 text-[13px]" />
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] font-semibold text-muted-foreground/50 uppercase tracking-wide w-24 shrink-0">Klant</span>
            <Select value={selectedClient || 'none'} onValueChange={v => setSelectedClient(v === 'none' ? '' : v)}>
              <SelectTrigger className="flex-1 h-9 text-[13px]"><SelectValue placeholder="Selecteer" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                {clients.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] font-semibold text-muted-foreground/50 uppercase tracking-wide w-24 shrink-0">Monteur</span>
            <Select value={selectedTechnician || 'none'} onValueChange={v => setSelectedTechnician(v === 'none' ? '' : v)}>
              <SelectTrigger className="flex-1 h-9 text-[13px]"><SelectValue placeholder="Selecteer" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                {technicians.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] font-semibold text-muted-foreground/50 uppercase tracking-wide w-24 shrink-0">Apparaat</span>
            <Select value={selectedEquipment || 'none'} onValueChange={v => setSelectedEquipment(v === 'none' ? '' : v)}>
              <SelectTrigger className="flex-1 h-9 text-[13px]"><SelectValue placeholder="Selecteer" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                {equipment.map((e: any) => <SelectItem key={e.id} value={e.id}>{e.device_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <button
            onClick={onSave}
            disabled={saving}
            className="ios-wizard-context-save"
          >
            {saving ? 'Opslaan…' : 'Opslaan'}
          </button>
        </div>
      )}
    </div>
  );
}
