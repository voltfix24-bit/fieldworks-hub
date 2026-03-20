import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, User } from 'lucide-react';
import { useProject } from '@/hooks/use-projects';
import { useMeasurementSession, useCreateMeasurementSession, useUpdateMeasurementSession } from '@/hooks/use-measurement-sessions';
import { useElectrodes, useCreateElectrode, useUpdateElectrode } from '@/hooks/use-electrodes';
import { usePens, useCreatePen, useUpdatePen } from '@/hooks/use-pens';
import { useDepthMeasurements, useCreateDepthMeasurement, useUpdateDepthMeasurement, useDeleteDepthMeasurement } from '@/hooks/use-depth-measurements';
import { useClients } from '@/hooks/use-clients';
import { useTechnicians } from '@/hooks/use-technicians';
import { useEquipmentList } from '@/hooks/use-equipment';
import { useAttachments, uploadMeasurementPhoto } from '@/hooks/use-attachments';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { GroundingIcon, GroundingLoader } from '@/components/measurement/GroundingIcon';

import { WizardStepIndicator } from '@/components/measurement/wizard/WizardStepIndicator';
import { StickyActionBar } from '@/components/measurement/wizard/StickyActionBar';
import { SetupStep } from '@/components/measurement/wizard/steps/SetupStep';
import { MeasurementStep } from '@/components/measurement/wizard/steps/MeasurementStep';
import { PhotoStep } from '@/components/measurement/wizard/steps/PhotoStep';
import { NextActionStep } from '@/components/measurement/wizard/steps/NextActionStep';
import { SketchStep } from '@/components/measurement/wizard/steps/SketchStep';

const PREDEFINED_DEPTHS = [3, 6, 9, 12, 15, 18, 21, 24, 27, 30];

const WIZARD_STEPS = [
  { label: 'Opstelling', key: 'setup' },
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

  const createPen = useCreatePen();
  const updatePen = useUpdatePen();

  const createMeasurement = useCreateDepthMeasurement();
  const updateMeasurement = useUpdateDepthMeasurement();
  const deleteMeasurement = useDeleteDepthMeasurement();

  const [step, setStep] = useState(0);
  const [showSketch, setShowSketch] = useState(false);
  const [measurementDate, setMeasurementDate] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedTechnician, setSelectedTechnician] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState('');
  const [notes, setNotes] = useState('');

  const [uploading, setUploading] = useState(false);
  const depthsInitRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (session) {
      setMeasurementDate(session.measurement_date || '');
      setSelectedClient(session.client_id || '');
      setSelectedTechnician(session.technician_id || '');
      setSelectedEquipment(session.equipment_id || '');
      setNotes(session.measurement_notes || '');
      if (electrodes.length > 0) setStep(1);
    } else if (project) {
      setMeasurementDate(project.planned_date || new Date().toISOString().split('T')[0]);
      setSelectedClient(project.client_id || '');
      setSelectedTechnician(project.technician_id || '');
      setSelectedEquipment(project.equipment_id || '');
    }
  }, [session?.id, project?.id]);

  useEffect(() => {
    if (electrodes.length > 0 && !electrodes.find((e: any) => e.id === activeElectrodeId)) {
      setActiveElectrodeId(electrodes[electrodes.length - 1].id);
    }
  }, [electrodes]);

  useEffect(() => {
    if (pens.length > 0 && !pens.find((p: any) => p.id === activePenId)) {
      setActivePenId(pens[pens.length - 1].id);
    }
  }, [pens]);

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

  const handleSaveSetup = async () => {
    const payload = {
      measurement_date: measurementDate || null,
      client_id: selectedClient || null,
      technician_id: selectedTechnician || null,
      equipment_id: selectedEquipment || null,
      measurement_notes: notes || null,
    };
    let sessionData;
    if (session) {
      sessionData = await updateSession.mutateAsync({ id: session.id, ...payload });
    } else {
      sessionData = await createSession.mutateAsync({ ...payload, tenant_id: tenantId, project_id: id });
    }

    if (electrodes.length === 0 && sessionData) {
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
    }
    setStep(1);
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
    setStep(1);
  };

  const handlePhotoUpload = async (type: 'display_photo_url' | 'overview_photo_url', file: File) => {
    if (!activePen) return;
    setUploading(true);
    try {
      const url = await uploadMeasurementPhoto(file, tenantId, activePen.project_id);
      updatePen.mutate({ id: activePen.id, [type]: url });
    } finally { setUploading(false); }
  };

  const recalcRa = useCallback((electrodeId: string, updatedMeasurements: any[]) => {
    const validValues = updatedMeasurements.filter((m: any) => m.resistance_value > 0).map((m: any) => m.resistance_value);
    const lowestResistance = validValues.length > 0 ? Math.min(...validValues) : null;
    updateElectrode.mutate({ id: electrodeId, ra_value: lowestResistance });
  }, [updateElectrode]);

  if (projectLoading || sessionLoading) return (
    <div className="flex justify-center py-20"><GroundingLoader /></div>
  );
  if (!project) return (
    <div className="text-center py-16">
      <p className="text-[13px] text-muted-foreground">Project niet gevonden</p>
    </div>
  );

  const techName = technicians.find((t: any) => t.id === selectedTechnician)?.full_name;
  const displayStep = showSketch ? 3 : step;

  return (
    <div className={`animate-fade-in max-w-2xl mx-auto ${isMobile ? 'px-2' : 'px-1 sm:px-4'}`}>
      {/* ─── Compact header ─── */}
      <div className={`flex items-center gap-2 ${isMobile ? 'mb-1.5 pt-0.5' : 'mb-4 pt-1'}`}>
        <button
          onClick={() => navigate(`/projects/${id}`)}
          className="h-8 w-8 flex items-center justify-center text-muted-foreground hover:text-foreground shrink-0 rounded-lg active:scale-95 transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className={`font-semibold text-foreground truncate flex items-center gap-1.5 tracking-tight ${isMobile ? 'text-[13px]' : 'text-[15px]'}`}>
            <GroundingIcon size={13} className="text-primary shrink-0" />
            {project.project_name}
          </h1>
          {!isMobile && (
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-[11px] text-muted-foreground font-mono tracking-wide">{project.project_number}</span>
              {measurementDate && (
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3 opacity-50" />{measurementDate}
                </span>
              )}
              {techName && (
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <User className="h-3 w-3 opacity-50" />{techName}
                </span>
              )}
            </div>
          )}
        </div>
        {/* Mobile: compact context chips */}
        {isMobile && activeElectrode && step > 0 && (
          <span className="text-[10px] font-semibold text-primary bg-primary/8 px-2 py-0.5 rounded-md shrink-0">
            {activeElectrode.electrode_code}
          </span>
        )}
      </div>

      {/* ─── Step indicator ─── */}
      <div className={`${isMobile ? 'mb-2 -mx-0.5' : 'mb-5 -mx-1 sm:mx-0'}`}>
        <WizardStepIndicator
          steps={WIZARD_STEPS}
          currentStep={displayStep}
          onStepClick={(i) => { setShowSketch(false); setStep(i); }}
          compact={isMobile}
        />
      </div>

      {/* ─── Step content ─── */}
      <div className={`wizard-step-enter ${isMobile ? 'min-h-[40vh]' : 'min-h-[50vh]'}`} key={showSketch ? 'sketch' : step}>
        {step === 0 && !showSketch && (
          <SetupStep
            measurementDate={measurementDate} setMeasurementDate={setMeasurementDate}
            selectedClient={selectedClient} setSelectedClient={setSelectedClient}
            selectedTechnician={selectedTechnician} setSelectedTechnician={setSelectedTechnician}
            selectedEquipment={selectedEquipment} setSelectedEquipment={setSelectedEquipment}
            notes={notes} setNotes={setNotes}
            clients={clients} technicians={technicians} equipment={equipment}
            compact={isMobile}
          />
        )}

        {step === 1 && !showSketch && activeElectrode && (
          <MeasurementStep
            electrode={activeElectrode}
            pens={pens}
            tenantId={tenantId}
            onUpdateElectrode={(updates) => updateElectrode.mutate({ id: activeElectrode.id, ...updates })}
            onAddPen={handleAddNewPen}
            recalcRa={recalcRa}
            depthsInitRef={depthsInitRef}
            initializeDepthRows={initializeDepthRows}
            compact={isMobile}
          />
        )}

        {step === 2 && !showSketch && activePen && (
          <PhotoStep
            displayPhotoUrl={activePen.display_photo_url}
            overviewPhotoUrl={activePen.overview_photo_url}
            onUploadDisplay={(file) => handlePhotoUpload('display_photo_url', file)}
            onUploadOverview={(file) => handlePhotoUpload('overview_photo_url', file)}
            onRemoveDisplay={() => updatePen.mutate({ id: activePen.id, display_photo_url: null })}
            onRemoveOverview={() => updatePen.mutate({ id: activePen.id, overview_photo_url: null })}
            uploading={uploading}
            penCode={activePen.pen_code}
            compact={isMobile}
          />
        )}

        {step === 3 && !showSketch && (
          <NextActionStep
            onAddElectrode={handleAddNewElectrode}
            onGoToSketch={() => setShowSketch(true)}
            onSave={() => navigate(`/projects/${id}`)}
            nextElectrodeNumber={electrodes.length + 1}
            compact={isMobile}
          />
        )}

        {showSketch && (
          <SketchStep projectId={id!} tenantId={tenantId} sessionId={session?.id} />
        )}
      </div>

      {/* ─── Sticky action bar ─── */}
      {step !== 3 && !showSketch && (
        <StickyActionBar
          showPrev={step > 0}
          onPrev={() => setStep(Math.max(0, step - 1))}
          onNext={step === 0 ? handleSaveSetup : () => setStep(step + 1)}
          nextLabel={step === 0 ? (session ? 'Opslaan & Verder' : 'Sessie Aanmaken') : 'Volgende'}
          nextLoading={createSession.isPending || updateSession.isPending || createElectrode.isPending || createPen.isPending}
          compact={isMobile}
        />
      )}

      {showSketch && (
        <StickyActionBar
          showPrev
          onPrev={() => setShowSketch(false)}
          onNext={() => { setShowSketch(false); navigate(`/projects/${id}`); }}
          nextLabel="Opslaan"
          compact={isMobile}
        />
      )}
    </div>
  );
}
