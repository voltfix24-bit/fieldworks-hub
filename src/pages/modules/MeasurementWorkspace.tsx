import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, User, Wrench } from 'lucide-react';
import { useProject } from '@/hooks/use-projects';
import { useMeasurementSession, useCreateMeasurementSession, useUpdateMeasurementSession } from '@/hooks/use-measurement-sessions';
import { useElectrodes, useCreateElectrode, useUpdateElectrode, useDeleteElectrode } from '@/hooks/use-electrodes';
import { usePens, useCreatePen, useUpdatePen, useDeletePen } from '@/hooks/use-pens';
import { useDepthMeasurements, useCreateDepthMeasurement, useUpdateDepthMeasurement, useDeleteDepthMeasurement } from '@/hooks/use-depth-measurements';
import { useClients } from '@/hooks/use-clients';
import { useTechnicians } from '@/hooks/use-technicians';
import { useEquipmentList } from '@/hooks/use-equipment';
import { useAttachments } from '@/hooks/use-attachments';
import { uploadMeasurementPhoto } from '@/hooks/use-attachments';
import { useAuth } from '@/contexts/AuthContext';
import { GroundingIcon, GroundingLoader } from '@/components/measurement/GroundingIcon';

import { WizardStepIndicator } from '@/components/measurement/wizard/WizardStepIndicator';
import { StickyActionBar } from '@/components/measurement/wizard/StickyActionBar';
import { SetupStep } from '@/components/measurement/wizard/steps/SetupStep';
import { ElectrodeStep } from '@/components/measurement/wizard/steps/ElectrodeStep';
import { PenStep } from '@/components/measurement/wizard/steps/PenStep';
import { MeasurementStep } from '@/components/measurement/wizard/steps/MeasurementStep';
import { PhotoStep } from '@/components/measurement/wizard/steps/PhotoStep';
import { NextActionStep } from '@/components/measurement/wizard/steps/NextActionStep';
import { SketchStep } from '@/components/measurement/wizard/steps/SketchStep';
import { ReadinessStep } from '@/components/measurement/wizard/steps/ReadinessStep';

const PREDEFINED_DEPTHS = [3, 6, 9, 12, 15, 18, 21, 24, 27, 30];

const WIZARD_STEPS = [
  { label: 'Opstelling', key: 'setup' },
  { label: 'Elektrode', key: 'electrode' },
  { label: 'Pen', key: 'pen' },
  { label: 'Metingen', key: 'measurements' },
  { label: "Foto's", key: 'photos' },
  { label: 'Volgende', key: 'next' },
  { label: 'Schets', key: 'sketch' },
  { label: 'Controle', key: 'readiness' },
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
  const deleteElectrode = useDeleteElectrode();

  const { data: clients = [] } = useClients();
  const { data: technicians = [] } = useTechnicians();
  const { data: equipment = [] } = useEquipmentList();
  const { data: attachments = [] } = useAttachments(id);

  // Active selections
  const [activeElectrodeId, setActiveElectrodeId] = useState<string | null>(null);
  const [activePenId, setActivePenId] = useState<string | null>(null);

  const activeElectrode = electrodes.find((e: any) => e.id === activeElectrodeId);
  const { data: pens = [] } = usePens(activeElectrodeId || undefined);
  const activePen = pens.find((p: any) => p.id === activePenId);

  const createPen = useCreatePen();
  const updatePen = useUpdatePen();
  const deletePen = useDeletePen();

  const { data: measurements = [] } = useDepthMeasurements(activePenId || undefined);
  const createMeasurement = useCreateDepthMeasurement();
  const updateMeasurement = useUpdateDepthMeasurement();
  const deleteMeasurement = useDeleteDepthMeasurement();

  // Wizard state
  const [step, setStep] = useState(0);
  const [measurementDate, setMeasurementDate] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedTechnician, setSelectedTechnician] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState('');
  const [notes, setNotes] = useState('');

  // Electrode form state
  const [electrodeCode, setElectrodeCode] = useState('E1');
  const [electrodeLabel, setElectrodeLabel] = useState('');
  const [isCoupled, setIsCoupled] = useState(false);
  const [targetValue, setTargetValue] = useState('');
  const [electrodeNotes, setElectrodeNotes] = useState('');

  // Pen form state
  const [penCode, setPenCode] = useState('P1');
  const [penLabel, setPenLabel] = useState('');
  const [penNotes, setPenNotes] = useState('');

  const [uploading, setUploading] = useState(false);
  const depthsInitRef = useRef<Set<string>>(new Set());

  // Prefill setup from existing data
  useEffect(() => {
    if (session) {
      setMeasurementDate(session.measurement_date || '');
      setSelectedClient(session.client_id || '');
      setSelectedTechnician(session.technician_id || '');
      setSelectedEquipment(session.equipment_id || '');
      setNotes(session.measurement_notes || '');
      if (electrodes.length > 0) {
        setStep(3);
      } else {
        setStep(1);
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
      setActiveElectrodeId(electrodes[0].id);
    }
  }, [electrodes]);

  // Sync active pen
  useEffect(() => {
    if (pens.length > 0 && !pens.find((p: any) => p.id === activePenId)) {
      setActivePenId(pens[0].id);
    }
  }, [pens]);

  // Sync electrode form when active electrode changes
  useEffect(() => {
    if (activeElectrode) {
      setElectrodeCode(activeElectrode.electrode_code || 'E1');
      setElectrodeLabel(activeElectrode.label || '');
      setIsCoupled(activeElectrode.is_coupled || false);
      setTargetValue(activeElectrode.target_value != null ? String(activeElectrode.target_value) : '');
      setElectrodeNotes(activeElectrode.notes || '');
    }
  }, [activeElectrodeId]);

  // Sync pen form when active pen changes
  useEffect(() => {
    if (activePen) {
      setPenCode(activePen.pen_code || 'P1');
      setPenLabel(activePen.label || '');
      setPenNotes(activePen.notes || '');
    }
  }, [activePenId]);

  // Auto-create predefined depth rows for a new pen (once only)
  useEffect(() => {
    if (activePenId && activePen && measurements.length === 0 && !depthsInitRef.current.has(activePenId)) {
      depthsInitRef.current.add(activePenId);
      PREDEFINED_DEPTHS.forEach((d, i) => {
        createMeasurement.mutate({
          tenant_id: tenantId, project_id: activePen.project_id,
          measurement_session_id: activePen.measurement_session_id,
          electrode_id: activePen.electrode_id,
          pen_id: activePenId, depth_meters: d, resistance_value: 0, sort_order: i,
        });
      });
    }
  }, [activePenId, measurements.length]);

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
    if (electrodes.length === 0 && sessionData) {
      const newElectrode = await createElectrode.mutateAsync({
        tenant_id: tenantId, project_id: id,
        measurement_session_id: sessionData.id,
        electrode_code: 'E1', sort_order: 0,
      });
      setActiveElectrodeId(newElectrode.id);
      setElectrodeCode('E1');
    }
    setStep(1);
  };

  const handleSaveElectrode = async () => {
    if (activeElectrode) {
      await updateElectrode.mutateAsync({
        id: activeElectrode.id,
        electrode_code: electrodeCode, label: electrodeLabel || null,
        is_coupled: isCoupled, target_value: targetValue ? parseFloat(targetValue) : null,
        notes: electrodeNotes || null,
      });
    }
    if (pens.length === 0 && activeElectrode) {
      const newPen = await createPen.mutateAsync({
        tenant_id: tenantId, project_id: activeElectrode.project_id,
        measurement_session_id: activeElectrode.measurement_session_id,
        electrode_id: activeElectrode.id,
        pen_code: 'P1', sort_order: 0,
      });
      setActivePenId(newPen.id);
      setPenCode('P1');
    }
    setStep(2);
  };

  const handleSavePen = async () => {
    if (activePen) {
      await updatePen.mutateAsync({
        id: activePen.id,
        pen_code: penCode, label: penLabel || null, notes: penNotes || null,
      });
    }
    setStep(3);
  };

  const handleAddMeasurement = (depth: number, resistance: number) => {
    if (!activePen) return;
    createMeasurement.mutate({
      tenant_id: tenantId, project_id: activePen.project_id,
      measurement_session_id: activePen.measurement_session_id,
      electrode_id: activePen.electrode_id,
      pen_id: activePen.id, depth_meters: depth, resistance_value: resistance,
      sort_order: measurements.length,
    }, {
      onSuccess: () => recalcRa([...measurements, { resistance_value: resistance }]),
    });
  };

  const handleUpdateMeasurement = (measurementId: string, depth: number, resistance: number) => {
    updateMeasurement.mutate({ id: measurementId, depth_meters: depth, resistance_value: resistance }, {
      onSuccess: () => recalcRa(measurements.map((m: any) => m.id === measurementId ? { ...m, resistance_value: resistance } : m)),
    });
  };

  const handleDeleteMeasurement = (measurementId: string) => {
    if (!activePen) return;
    deleteMeasurement.mutate({ id: measurementId, penId: activePen.id }, {
      onSuccess: () => recalcRa(measurements.filter((m: any) => m.id !== measurementId)),
    });
  };

  const recalcRa = useCallback((updatedMeasurements: any[]) => {
    if (!activeElectrode) return;
    const validValues = updatedMeasurements.filter((m: any) => m.resistance_value > 0).map((m: any) => m.resistance_value);
    const lowestResistance = validValues.length > 0 ? Math.min(...validValues) : null;
    updateElectrode.mutate({ id: activeElectrode.id, ra_value: lowestResistance });
  }, [activeElectrode?.id]);

  const handlePhotoUpload = async (type: 'display_photo_url' | 'overview_photo_url', file: File) => {
    if (!activePen) return;
    setUploading(true);
    try {
      const url = await uploadMeasurementPhoto(file, tenantId, activePen.project_id);
      updatePen.mutate({ id: activePen.id, [type]: url });
    } finally { setUploading(false); }
  };

  const handleAddNewPen = async () => {
    if (!activeElectrode) return;
    const newPen = await createPen.mutateAsync({
      tenant_id: tenantId, project_id: activeElectrode.project_id,
      measurement_session_id: activeElectrode.measurement_session_id,
      electrode_id: activeElectrode.id,
      pen_code: `P${pens.length + 1}`, sort_order: pens.length,
    });
    setActivePenId(newPen.id);
    setPenCode(`P${pens.length + 1}`);
    setPenLabel('');
    setPenNotes('');
    setStep(2);
  };

  const handleAddNewElectrode = async () => {
    if (!session) return;
    const newElectrode = await createElectrode.mutateAsync({
      tenant_id: tenantId, project_id: id,
      measurement_session_id: session.id,
      electrode_code: `E${electrodes.length + 1}`, sort_order: electrodes.length,
    });
    setActiveElectrodeId(newElectrode.id);
    setElectrodeCode(`E${electrodes.length + 1}`);
    setElectrodeLabel('');
    setIsCoupled(false);
    setTargetValue('');
    setElectrodeNotes('');
    setStep(1);
  };

  // Loading
  if (projectLoading || sessionLoading) return (
    <div className="flex justify-center py-20"><GroundingLoader /></div>
  );
  if (!project) return (
    <div className="text-center py-16">
      <p className="text-[13px] text-muted-foreground">Project niet gevonden</p>
    </div>
  );

  // Readiness
  const hasSession = !!session;
  const hasElectrodes = electrodes.length > 0;
  const hasPens = pens.length > 0;
  const hasMeasurements = measurements.length > 0;
  const hasClient = !!(session?.client_id || project.client_id);
  const hasTechnician = !!(session?.technician_id || project.technician_id);
  const hasEquipment = !!(session?.equipment_id || project.equipment_id);
  const hasSketches = attachments.some((a: any) => a.attachment_type === 'sketch_photo' || a.attachment_type === 'sketch_file');

  const readinessItems = [
    { label: 'Meetsessie aangemaakt', met: hasSession },
    { label: 'Opdrachtgever toegewezen', met: hasClient },
    { label: 'Monteur toegewezen', met: hasTechnician },
    { label: 'Apparatuur toegewezen', met: hasEquipment },
    { label: 'Minimaal één elektrode', met: hasElectrodes },
    { label: 'Minimaal één pen', met: hasPens },
    { label: 'Minimaal één meting', met: hasMeasurements },
    { label: 'Schets / foto', met: hasSketches, optional: true },
  ];

  const techName = technicians.find((t: any) => t.id === selectedTechnician)?.full_name;

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
        <WizardStepIndicator steps={WIZARD_STEPS} currentStep={step} />
      </div>

      {/* ─── Step content ─── */}
      <div className="min-h-[50vh] wizard-step-enter" key={step}>
        {step === 0 && (
          <SetupStep
            measurementDate={measurementDate} setMeasurementDate={setMeasurementDate}
            selectedClient={selectedClient} setSelectedClient={setSelectedClient}
            selectedTechnician={selectedTechnician} setSelectedTechnician={setSelectedTechnician}
            selectedEquipment={selectedEquipment} setSelectedEquipment={setSelectedEquipment}
            notes={notes} setNotes={setNotes}
            clients={clients} technicians={technicians} equipment={equipment}
          />
        )}

        {step === 1 && (
          <ElectrodeStep
            electrodeCode={electrodeCode} setElectrodeCode={setElectrodeCode}
            electrodeLabel={electrodeLabel} setElectrodeLabel={setElectrodeLabel}
            isCoupled={isCoupled} setIsCoupled={setIsCoupled}
            targetValue={targetValue} setTargetValue={setTargetValue}
            electrodeNotes={electrodeNotes} setElectrodeNotes={setElectrodeNotes}
          />
        )}

        {step === 2 && (
          <PenStep
            penCode={penCode} setPenCode={setPenCode}
            penLabel={penLabel} setPenLabel={setPenLabel}
            penNotes={penNotes} setPenNotes={setPenNotes}
          />
        )}

        {step === 3 && activeElectrode && (
          <MeasurementStep
            measurements={measurements}
            onAdd={handleAddMeasurement}
            onUpdate={handleUpdateMeasurement}
            onDelete={handleDeleteMeasurement}
            electrode={activeElectrode}
            penCount={pens.length}
            onUpdateElectrode={(updates) => updateElectrode.mutate({ id: activeElectrode.id, ...updates })}
            penCode={activePen?.pen_code || 'P1'}
          />
        )}

        {step === 4 && activePen && (
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

        {step === 5 && (
          <NextActionStep
            onAddPen={handleAddNewPen}
            onAddElectrode={handleAddNewElectrode}
            onGoToSketch={() => setStep(6)}
            onSaveAndExit={() => navigate(`/projects/${id}`)}
          />
        )}

        {step === 6 && (
          <SketchStep projectId={id!} tenantId={tenantId} sessionId={session?.id} />
        )}

        {step === 7 && (
          <ReadinessStep items={readinessItems} />
        )}
      </div>

      {/* ─── Sticky action bar ─── */}
      {step !== 5 && (
        <StickyActionBar
          showPrev={step > 0}
          onPrev={() => setStep(Math.max(0, step - 1))}
          onNext={
            step === 0 ? handleSaveSetup :
            step === 1 ? handleSaveElectrode :
            step === 2 ? handleSavePen :
            step === 7 ? () => navigate(`/projects/${id}`) :
            () => setStep(step + 1)
          }
          nextLabel={
            step === 0 ? (session ? 'Opslaan & Verder' : 'Sessie Aanmaken') :
            step === 1 ? 'Opslaan & Verder' :
            step === 2 ? 'Opslaan & Meten' :
            step === 7 ? 'Terug naar Project' :
            'Volgende'
          }
          nextLoading={createSession.isPending || updateSession.isPending || createElectrode.isPending || createPen.isPending}
        />
      )}
    </div>
  );
}
