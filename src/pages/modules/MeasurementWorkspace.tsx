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
  const tenantId = profile?.tenant_id || '';

  // Data queries
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

  // Active electrode
  const [activeElectrodeId, setActiveElectrodeId] = useState<string | null>(null);
  const activeElectrode = electrodes.find((e: any) => e.id === activeElectrodeId);
  const { data: pens = [] } = usePens(activeElectrodeId || undefined);

  // Active pen (for photos step)
  const [activePenId, setActivePenId] = useState<string | null>(null);
  const activePen = pens.find((p: any) => p.id === activePenId);

  const createPen = useCreatePen();
  const updatePen = useUpdatePen();

  const createMeasurement = useCreateDepthMeasurement();
  const updateMeasurement = useUpdateDepthMeasurement();
  const deleteMeasurement = useDeleteDepthMeasurement();

  // Wizard state
  const [step, setStep] = useState(0);
  const [showSketch, setShowSketch] = useState(false);
  const [measurementDate, setMeasurementDate] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedTechnician, setSelectedTechnician] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState('');
  const [notes, setNotes] = useState('');

  const [uploading, setUploading] = useState(false);
  const depthsInitRef = useRef<Set<string>>(new Set());

  // Prefill from existing data
  useEffect(() => {
    if (session) {
      setMeasurementDate(session.measurement_date || '');
      setSelectedClient(session.client_id || '');
      setSelectedTechnician(session.technician_id || '');
      setSelectedEquipment(session.equipment_id || '');
      setNotes(session.measurement_notes || '');
      if (electrodes.length > 0) {
        setStep(1); // go straight to measurements
      }
    } else if (project) {
      setMeasurementDate(project.planned_date || new Date().toISOString().split('T')[0]);
      setSelectedClient(project.client_id || '');
      setSelectedTechnician(project.technician_id || '');
      setSelectedEquipment(project.equipment_id || '');
    }
  }, [session?.id, project?.id]);

  // Sync active electrode
  useEffect(() => {
    if (electrodes.length > 0 && !electrodes.find((e: any) => e.id === activeElectrodeId)) {
      setActiveElectrodeId(electrodes[electrodes.length - 1].id);
    }
  }, [electrodes]);

  // Sync active pen to latest pen
  useEffect(() => {
    if (pens.length > 0 && !pens.find((p: any) => p.id === activePenId)) {
      setActivePenId(pens[pens.length - 1].id);
    }
  }, [pens]);

  // Auto-create predefined depth rows for new pens
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

  // === Step handlers ===

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

    // Auto-create first electrode + first pen + depth rows
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

    // Scroll to new pen after a tick
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

    setStep(1); // back to measurements for new electrode
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

  // Loading
  if (projectLoading || sessionLoading) return (
    <div className="flex justify-center py-20"><GroundingLoader /></div>
  );
  if (!project) return (
    <div className="text-center py-16">
      <p className="text-[13px] text-muted-foreground">Project niet gevonden</p>
    </div>
  );

  const techName = technicians.find((t: any) => t.id === selectedTechnician)?.full_name;

  // Determine actual step index for display (sketch is a sub-view, not a step)
  const displayStep = showSketch ? 3 : step;

  return (
    <div className="animate-fade-in max-w-2xl mx-auto px-1 sm:px-4">
      {/* ─── Project context header ─── */}
      <div className="flex items-center gap-3 mb-4 pt-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/projects/${id}`)}
          className="h-9 w-9 text-muted-foreground hover:text-foreground shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-[15px] font-semibold text-foreground truncate flex items-center gap-2 tracking-tight">
            <GroundingIcon size={15} className="text-primary shrink-0" />
            {project.project_name}
          </h1>
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
        </div>
      </div>

      {/* ─── Step indicator ─── */}
      <div className="mb-5 -mx-1 sm:mx-0">
        <WizardStepIndicator steps={WIZARD_STEPS} currentStep={displayStep} onStepClick={(i) => { setShowSketch(false); setStep(i); }} />
      </div>

      {/* ─── Step content ─── */}
      <div className="min-h-[50vh] wizard-step-enter" key={showSketch ? 'sketch' : step}>
        {step === 0 && !showSketch && (
          <SetupStep
            measurementDate={measurementDate} setMeasurementDate={setMeasurementDate}
            selectedClient={selectedClient} setSelectedClient={setSelectedClient}
            selectedTechnician={selectedTechnician} setSelectedTechnician={setSelectedTechnician}
            selectedEquipment={selectedEquipment} setSelectedEquipment={setSelectedEquipment}
            notes={notes} setNotes={setNotes}
            clients={clients} technicians={technicians} equipment={equipment}
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
          />
        )}

        {step === 3 && !showSketch && (
          <NextActionStep
            onAddElectrode={handleAddNewElectrode}
            onGoToSketch={() => setShowSketch(true)}
            onSave={() => navigate(`/projects/${id}`)}
            nextElectrodeNumber={electrodes.length + 1}
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
          onNext={
            step === 0 ? handleSaveSetup :
            () => setStep(step + 1)
          }
          nextLabel={
            step === 0 ? (session ? 'Opslaan & Verder' : 'Sessie Aanmaken') :
            'Volgende'
          }
          nextLoading={createSession.isPending || updateSession.isPending || createElectrode.isPending || createPen.isPending}
        />
      )}

      {showSketch && (
        <StickyActionBar
          showPrev
          onPrev={() => setShowSketch(false)}
          onNext={() => {
            setShowSketch(false);
            navigate(`/projects/${id}`);
          }}
          nextLabel="Opslaan"
        />
      )}
    </div>
  );
}
