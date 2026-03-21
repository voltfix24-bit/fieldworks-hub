import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp, Pencil, WifiOff } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useProject } from '@/hooks/use-projects';
import { useMeasurementSession, useCreateMeasurementSession, useUpdateMeasurementSession } from '@/hooks/use-measurement-sessions';
import { useElectrodes, useCreateElectrode, useUpdateElectrode } from '@/hooks/use-electrodes';
import { usePens, useCreatePen, useUpdatePen } from '@/hooks/use-pens';
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

  const [uploading, setUploading] = useState(false);
  const [autoInitDone, setAutoInitDone] = useState(false);
  const [progressionWarningDismissed, setProgressionWarningDismissed] = useState(false);
  const [handtekeningB64, setHandtekeningB64] = useState<string | null>(null);
  const depthsInitRef = useRef<Set<string>>(new Set());

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
        } catch (e) { console.error('Auto-init failed', e); }
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
    setStep(0); // back to measurements
  };

  const handlePhotoUpload = async (type: 'display_photo_url' | 'overview_photo_url', file: File) => {
    // Koppel altijd aan de EERSTE pen van de actieve elektrode
    const firstPen = pens[0];
    if (!firstPen) return;
    setUploading(true);
    try {
      const url = await uploadMeasurementPhoto(file, tenantId, firstPen.project_id);
      try {
        await updatePen.mutateAsync({ id: firstPen.id, [type]: url });
      } catch (dbErr: any) {
        toast({ variant: 'destructive', title: 'Database-update mislukt', description: dbErr?.message || 'Foto geüpload maar koppeling mislukt.' });
      }
    } catch (uploadErr: any) {
      toast({ variant: 'destructive', title: 'Upload mislukt', description: uploadErr?.message || 'Controleer je verbinding en probeer opnieuw.' });
    } finally { setUploading(false); }
  };

  const recalcRa = useCallback((electrodeId: string, updatedMeasurements: any[]) => {
    const validValues = updatedMeasurements.filter((m: any) => m.resistance_value > 0).map((m: any) => m.resistance_value);
    const lowestResistance = validValues.length > 0 ? Math.min(...validValues) : null;
    updateElectrode.mutate({ id: electrodeId, ra_value: lowestResistance, rv_value: null });
  }, [updateElectrode]);

  if (projectLoading || sessionLoading) return (
    <div className="flex justify-center py-20"><GroundingLoader /></div>
  );
  if (!project) return (
    <div className="text-center py-16">
      <p className="text-[13px] text-muted-foreground">Project niet gevonden</p>
    </div>
  );

  const clientName = clients.find((c: any) => c.id === (session?.client_id || selectedClient))?.company_name;
  const techName = technicians.find((t: any) => t.id === (session?.technician_id || selectedTechnician))?.full_name;
  const equipName = equipment.find((e: any) => e.id === (session?.equipment_id || selectedEquipment))?.device_name;
  const displayStep = showSketch ? -1 : step;

  // ═══════════════════════════════════════════════
  // MOBILE: fullscreen work mode
  // ═══════════════════════════════════════════════
  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col animate-fade-in">
        {/* ─── iOS sticky top nav ─── */}
        <div className="ios-wizard-topnav shrink-0">
          <div className="ios-wizard-nav-row">
            <button
              onClick={() => navigate(`/projects/${id}`)}
              className="ios-wizard-nav-back"
            >
              <svg width="8" height="14" viewBox="0 0 8 14" fill="none"><path d="M7 1L1 7L7 13" stroke="hsl(var(--tenant-primary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <span>{project.project_name}</span>
            </button>
            {activeElectrode && !showSketch && (
              <span className="ios-wizard-nav-badge">
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
                    if (i <= step) { setShowSketch(false); setStep(i); setProgressionWarningDismissed(false); }
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

        {/* ─── Scrollable content ─── */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 pt-3 pb-2" key={showSketch ? 'sketch' : step}>
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
              />
            )}

            {step === 0 && !showSketch && activeElectrode && (
              <MeasurementStep
                electrode={activeElectrode}
                pens={pens}
                tenantId={tenantId}
                onUpdateElectrode={(updates) => updateElectrode.mutate({ id: activeElectrode.id, ...updates })}
                onAddPen={handleAddNewPen}
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
                displayPhotoUrl={pens[0]?.display_photo_url ?? null}
                overviewPhotoUrl={pens[0]?.overview_photo_url ?? null}
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
                <button className="ios-wizard-warning-btn" onClick={() => { setProgressionWarningDismissed(true); setStep(step + 1); }}>
                  Doorgaan
                </button>
              </div>
            )}
            <div className="ios-wizard-bottom-bar">
              {step > 0 ? (
                <button className="ios-wizard-btn-back" onClick={() => { setStep(Math.max(0, step - 1)); setProgressionWarningDismissed(false); }}>
                  <svg width="8" height="14" viewBox="0 0 8 14" fill="none"><path d="M7 1L1 7L7 13" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Vorige
                </button>
              ) : <div />}
              <button
                className={cn('ios-wizard-btn-next', rvMissing && step === 0 && 'opacity-40 pointer-events-none')}
                onClick={() => {
                  if (step === 0 && warningCount > 0 && !progressionWarningDismissed) return;
                  if (step === 0 && rvMissing) return;
                  setProgressionWarningDismissed(false);
                  setStep(step + 1);
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
          onClick={() => navigate(`/projects/${id}`)}
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

      <div className="mb-5 -mx-1 sm:mx-0">
        <WizardStepIndicator
          steps={DESKTOP_STEPS}
          currentStep={desktopStep}
          onStepClick={(i) => { setShowSketch(false); setStep(i === 0 ? -1 : i - 1); }}
        />
      </div>

      <div className="min-h-[50vh] wizard-step-enter" key={showSketch ? 'sketch' : step}>
        {step === -1 && !showSketch && (
          <SetupStep
            measurementDate={measurementDate} setMeasurementDate={setMeasurementDate}
            selectedClient={selectedClient} setSelectedClient={setSelectedClient}
            selectedTechnician={selectedTechnician} setSelectedTechnician={setSelectedTechnician}
            selectedEquipment={selectedEquipment} setSelectedEquipment={setSelectedEquipment}
            notes={notes} setNotes={setNotes}
            clients={clients} technicians={technicians} equipment={equipment}
          />
        )}

        {step === 0 && !showSketch && activeElectrode && (
          <MeasurementStep
            electrode={activeElectrode}
            pens={pens}
            tenantId={tenantId}
            onUpdateElectrode={(updates) => updateElectrode.mutate({ id: activeElectrode.id, ...updates })}
            onAddPen={handleAddNewPen}
            recalcRa={recalcRa}
            depthsInitRef={depthsInitRef}
            initializeDepthRows={initializeDepthRows}
            onRvMissingChange={setRvMissing}
          />
        )}

        {step === 1 && !showSketch && activeElectrode && pens.length > 0 && (
          <PhotoStep
            electrodeCode={activeElectrode.electrode_code}
            displayPhotoUrl={pens[0]?.display_photo_url ?? null}
            overviewPhotoUrl={pens[0]?.overview_photo_url ?? null}
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
          onPrev={() => setStep(step - 1)}
          onNext={step === -1 ? handleSaveContext : () => { if (step === 0 && rvMissing) return; setStep(step + 1); }}
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
}

function MobileContextBlock({
  clientName, techName, equipName, date, open, onToggle, onSave, saving,
  measurementDate, setMeasurementDate,
  selectedClient, setSelectedClient,
  selectedTechnician, setSelectedTechnician,
  selectedEquipment, setSelectedEquipment,
  clients, technicians, equipment,
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
        <div className="ios-wizard-context-edit">
          <Pencil className="h-3 w-3" />
        </div>
      </button>

      {open && (
        <div className="px-4 pb-3 pt-2 space-y-2.5 border-t border-border/10 animate-in slide-in-from-top-1 duration-150">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-0.5">
              <Label className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground/50">Datum</Label>
              <Input type="date" value={measurementDate} onChange={e => setMeasurementDate(e.target.value)} className="h-8 text-[11px]" />
            </div>
            <div className="space-y-0.5">
              <Label className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground/50">Apparaat</Label>
              <Select value={selectedEquipment || 'none'} onValueChange={v => setSelectedEquipment(v === 'none' ? '' : v)}>
                <SelectTrigger className="h-8 text-[11px]"><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {equipment.map((e: any) => <SelectItem key={e.id} value={e.id}>{e.device_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-0.5">
              <Label className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground/50">Opdrachtgever</Label>
              <Select value={selectedClient || 'none'} onValueChange={v => setSelectedClient(v === 'none' ? '' : v)}>
                <SelectTrigger className="h-8 text-[11px]"><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {clients.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-0.5">
              <Label className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground/50">Monteur</Label>
              <Select value={selectedTechnician || 'none'} onValueChange={v => setSelectedTechnician(v === 'none' ? '' : v)}>
                <SelectTrigger className="h-8 text-[11px]"><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {technicians.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
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
