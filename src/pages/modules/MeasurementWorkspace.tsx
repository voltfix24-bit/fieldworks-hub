import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Zap, Ruler, Calendar, User, Wrench } from 'lucide-react';
import { useProject } from '@/hooks/use-projects';
import { useMeasurementSession, useCreateMeasurementSession, useUpdateMeasurementSession } from '@/hooks/use-measurement-sessions';
import { useElectrodes, useCreateElectrode, useUpdateElectrode, useDeleteElectrode } from '@/hooks/use-electrodes';
import { useClients } from '@/hooks/use-clients';
import { useTechnicians } from '@/hooks/use-technicians';
import { useEquipmentList } from '@/hooks/use-equipment';
import { useAuth } from '@/contexts/AuthContext';
import { ElectrodeCard } from '@/components/measurement/ElectrodeCard';
import { SketchAttachmentsSection } from '@/components/measurement/SketchAttachmentsSection';
import { ReadinessChecklist } from '@/components/measurement/ReadinessChecklist';
import { useAttachments } from '@/hooks/use-attachments';

export default function MeasurementWorkspace() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id || '';

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

  // Setup form state
  const [measurementDate, setMeasurementDate] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedTechnician, setSelectedTechnician] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState('');
  const [notes, setNotes] = useState('');
  const [setupDirty, setSetupDirty] = useState(false);

  // Prefill from session or project
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
  }, [session, project]);

  const handleSaveSetup = async () => {
    const payload = {
      measurement_date: measurementDate || null,
      client_id: selectedClient || null,
      technician_id: selectedTechnician || null,
      equipment_id: selectedEquipment || null,
      measurement_notes: notes || null,
    };

    if (session) {
      await updateSession.mutateAsync({ id: session.id, ...payload });
    } else {
      await createSession.mutateAsync({
        ...payload,
        tenant_id: tenantId,
        project_id: id,
      });
    }
    setSetupDirty(false);
  };

  const handleAddElectrode = () => {
    if (!session) return;
    createElectrode.mutate({
      tenant_id: tenantId,
      project_id: id,
      measurement_session_id: session.id,
      electrode_code: `E${electrodes.length + 1}`,
      sort_order: electrodes.length,
    });
  };

  if (projectLoading || sessionLoading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  if (!project) {
    return <p className="text-muted-foreground text-center py-12">Project not found</p>;
  }

  // Readiness checks
  const hasSession = !!session;
  const hasElectrodes = electrodes.length > 0;
  const hasClient = !!(session?.client_id || project.client_id);
  const hasTechnician = !!(session?.technician_id || project.technician_id);
  const hasEquipment = !!(session?.equipment_id || project.equipment_id);
  const hasSketches = attachments.some((a: any) => a.attachment_type === 'sketch_photo' || a.attachment_type === 'sketch_file');

  const readinessItems = [
    { label: 'Measurement setup completed', met: hasSession },
    { label: 'Client assigned', met: hasClient },
    { label: 'Technician assigned', met: hasTechnician },
    { label: 'Equipment assigned', met: hasEquipment },
    { label: 'At least one electrode', met: hasElectrodes },
    { label: 'Sketch / photo added', met: hasSketches, optional: true },
  ];

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      {/* Back button */}
      <div className="mb-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/projects/${id}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Project
        </Button>
      </div>

      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border pb-3 mb-6 -mx-4 px-4 pt-1">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground flex items-center gap-2">
              <Ruler className="h-5 w-5 text-primary" />
              {project.project_name}
            </h1>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-xs text-muted-foreground font-mono">{project.project_number}</span>
              {measurementDate && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> {measurementDate}
                </span>
              )}
              {selectedTechnician && technicians.find((t: any) => t.id === selectedTechnician) && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <User className="h-3 w-3" /> {(technicians.find((t: any) => t.id === selectedTechnician) as any)?.full_name}
                </span>
              )}
              {selectedEquipment && equipment.find((e: any) => e.id === selectedEquipment) && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Wrench className="h-3 w-3" /> {(equipment.find((e: any) => e.id === selectedEquipment) as any)?.device_name}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{electrodes.length} electrode{electrodes.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
        {/* Main content */}
        <div className="space-y-4">
          {/* Measurement Setup */}
          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Ruler className="h-4 w-4 text-primary" /> Measurement Setup
                {hasSession && <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-700 font-medium">Saved</span>}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-0 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Measurement Date</Label>
                  <Input
                    type="date"
                    value={measurementDate}
                    onChange={e => { setMeasurementDate(e.target.value); setSetupDirty(true); }}
                    className="h-9 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Client</Label>
                  <Select value={selectedClient} onValueChange={v => { setSelectedClient(v); setSetupDirty(true); }}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select client" /></SelectTrigger>
                    <SelectContent>
                      {clients.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Technician</Label>
                  <Select value={selectedTechnician} onValueChange={v => { setSelectedTechnician(v); setSetupDirty(true); }}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select technician" /></SelectTrigger>
                    <SelectContent>
                      {technicians.map((t: any) => (
                        <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Equipment</Label>
                  <Select value={selectedEquipment} onValueChange={v => { setSelectedEquipment(v); setSetupDirty(true); }}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select equipment" /></SelectTrigger>
                    <SelectContent>
                      {equipment.map((e: any) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.device_name}{e.is_default ? ' ★' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-xs">Notes</Label>
                <Textarea
                  value={notes}
                  onChange={e => { setNotes(e.target.value); setSetupDirty(true); }}
                  className="text-sm min-h-[60px]"
                  placeholder="Measurement notes…"
                />
              </div>
              <Button
                size="sm"
                onClick={handleSaveSetup}
                disabled={createSession.isPending || updateSession.isPending}
              >
                {session ? 'Update Setup' : 'Create Measurement Session'}
              </Button>
            </CardContent>
          </Card>

          {/* Electrodes */}
          {hasSession && (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" /> Electrodes
                </h2>
                <Button size="sm" onClick={handleAddElectrode} disabled={createElectrode.isPending}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Electrode
                </Button>
              </div>

              {electrodes.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-8 text-center">
                    <Zap className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No electrodes added yet</p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={handleAddElectrode}>
                      <Plus className="mr-1.5 h-3.5 w-3.5" /> Add first electrode
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {electrodes.map((electrode: any) => (
                    <ElectrodeCard
                      key={electrode.id}
                      electrode={electrode}
                      onUpdate={(updates) => updateElectrode.mutate({ id: electrode.id, ...updates })}
                      onDelete={() => deleteElectrode.mutate({ id: electrode.id, sessionId: session!.id })}
                    />
                  ))}
                </div>
              )}

              {/* Sketch section */}
              <SketchAttachmentsSection
                projectId={id!}
                tenantId={tenantId}
                sessionId={session?.id}
              />
            </>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <ReadinessChecklist items={readinessItems} />
        </div>
      </div>
    </div>
  );
}
