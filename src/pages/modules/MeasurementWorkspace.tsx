import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Calendar, User, Wrench, Ruler, ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useProject } from '@/hooks/use-projects';
import { useMeasurementSession, useCreateMeasurementSession, useUpdateMeasurementSession } from '@/hooks/use-measurement-sessions';
import { useElectrodes, useCreateElectrode, useUpdateElectrode, useDeleteElectrode } from '@/hooks/use-electrodes';
import { useClients } from '@/hooks/use-clients';
import { useTechnicians } from '@/hooks/use-technicians';
import { useEquipmentList } from '@/hooks/use-equipment';
import { useAuth } from '@/contexts/AuthContext';
import { ElectrodeTabSwitcher } from '@/components/measurement/ElectrodeTabSwitcher';
import { ElectrodeCard } from '@/components/measurement/ElectrodeCard';
import { SketchAttachmentsSection } from '@/components/measurement/SketchAttachmentsSection';
import { ReadinessChecklist } from '@/components/measurement/ReadinessChecklist';
import { useAttachments } from '@/hooks/use-attachments';
import { cn } from '@/lib/utils';

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

  const [measurementDate, setMeasurementDate] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedTechnician, setSelectedTechnician] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState('');
  const [notes, setNotes] = useState('');
  const [setupDirty, setSetupDirty] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const [activeElectrodeId, setActiveElectrodeId] = useState<string | null>(null);

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
      setSetupOpen(true); // auto-open setup for new sessions
    }
  }, [session, project]);

  // Auto-select first electrode
  useEffect(() => {
    if (electrodes.length > 0 && (!activeElectrodeId || !electrodes.find((e: any) => e.id === activeElectrodeId))) {
      setActiveElectrodeId(electrodes[0].id);
    }
  }, [electrodes, activeElectrodeId]);

  const activeElectrode = electrodes.find((e: any) => e.id === activeElectrodeId);

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
      await createSession.mutateAsync({ ...payload, tenant_id: tenantId, project_id: id });
    }
    setSetupDirty(false);
    setSetupOpen(false);
  };

  const handleAddElectrode = () => {
    if (!session) return;
    createElectrode.mutate({
      tenant_id: tenantId, project_id: id, measurement_session_id: session.id,
      electrode_code: `E${electrodes.length + 1}`, sort_order: electrodes.length,
    }, {
      onSuccess: (data) => setActiveElectrodeId(data.id),
    });
  };

  if (projectLoading || sessionLoading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (!project) return <p className="text-muted-foreground text-center py-12">Project niet gevonden</p>;

  const hasSession = !!session;
  const hasElectrodes = electrodes.length > 0;
  const hasClient = !!(session?.client_id || project.client_id);
  const hasTechnician = !!(session?.technician_id || project.technician_id);
  const hasEquipment = !!(session?.equipment_id || project.equipment_id);
  const hasSketches = attachments.some((a: any) => a.attachment_type === 'sketch_photo' || a.attachment_type === 'sketch_file');

  const readinessItems = [
    { label: 'Meetsessie aangemaakt', met: hasSession },
    { label: 'Klant toegewezen', met: hasClient },
    { label: 'Monteur toegewezen', met: hasTechnician },
    { label: 'Apparatuur toegewezen', met: hasEquipment },
    { label: 'Minimaal één elektrode', met: hasElectrodes },
    { label: 'Schets / foto', met: hasSketches, optional: true },
  ];

  const techName = technicians.find((t: any) => t.id === selectedTechnician)?.full_name;
  const equipName = equipment.find((e: any) => e.id === selectedEquipment)?.device_name;

  return (
    <div className="animate-fade-in max-w-5xl mx-auto">
      {/* Back button */}
      <div className="mb-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/projects/${id}`)} className="text-muted-foreground">
          <ArrowLeft className="mr-1.5 h-4 w-4" /> Terug
        </Button>
      </div>

      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border pb-3 mb-5 -mx-4 px-4 pt-1">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
              <Ruler className="h-5 w-5 text-primary" />{project.project_name}
            </h1>
            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
              <span className="text-xs text-muted-foreground font-mono">{project.project_number}</span>
              {measurementDate && <span className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" />{measurementDate}</span>}
              {techName && <span className="text-xs text-muted-foreground flex items-center gap-1"><User className="h-3 w-3" />{techName}</span>}
              {equipName && <span className="text-xs text-muted-foreground flex items-center gap-1"><Wrench className="h-3 w-3" />{equipName}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-6">
        <div className="space-y-5">
          {/* Setup section — collapsible once saved */}
          <Collapsible open={setupOpen} onOpenChange={setSetupOpen}>
            <CollapsibleTrigger asChild>
              <button className={cn(
                'w-full flex items-center justify-between px-4 py-3 rounded-xl border border-border bg-card',
                'text-sm font-medium text-foreground hover:bg-muted/30 transition-colors'
              )}>
                <div className="flex items-center gap-2">
                  <Ruler className="h-4 w-4 text-primary" />
                  <span>Meetopstelling</span>
                  {hasSession && <span className="text-xs px-1.5 py-0.5 rounded bg-green-100 text-green-700 font-medium">Opgeslagen</span>}
                </div>
                <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', setupOpen && 'rotate-180')} />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-2 rounded-xl border border-border bg-card p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div><Label className="text-xs">Meetdatum</Label><Input type="date" value={measurementDate} onChange={e => { setMeasurementDate(e.target.value); setSetupDirty(true); }} className="h-9 text-sm" /></div>
                  <div><Label className="text-xs">Klant</Label>
                    <Select value={selectedClient || "none"} onValueChange={v => { setSelectedClient(v === "none" ? "" : v); setSetupDirty(true); }}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Selecteer klant" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">— Geen selectie —</SelectItem>
                        {clients.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label className="text-xs">Monteur</Label>
                    <Select value={selectedTechnician || "none"} onValueChange={v => { setSelectedTechnician(v === "none" ? "" : v); setSetupDirty(true); }}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Selecteer monteur" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">— Geen selectie —</SelectItem>
                        {technicians.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label className="text-xs">Apparatuur</Label>
                    <Select value={selectedEquipment || "none"} onValueChange={v => { setSelectedEquipment(v === "none" ? "" : v); setSetupDirty(true); }}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Selecteer apparatuur" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">— Geen selectie —</SelectItem>
                        {equipment.map((e: any) => <SelectItem key={e.id} value={e.id}>{e.device_name}{e.is_default ? ' ★' : ''}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div><Label className="text-xs">Notities</Label><Textarea value={notes} onChange={e => { setNotes(e.target.value); setSetupDirty(true); }} className="text-sm min-h-[60px]" placeholder="Meetnotities…" /></div>
                <Button size="sm" onClick={handleSaveSetup} disabled={createSession.isPending || updateSession.isPending}>
                  {session ? 'Opslaan' : 'Meetsessie aanmaken'}
                </Button>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Electrode workspace */}
          {hasSession && (
            <>
              {/* Electrode tab switcher */}
              <ElectrodeTabSwitcher
                electrodes={electrodes}
                activeId={activeElectrodeId}
                onSelect={setActiveElectrodeId}
                onAdd={handleAddElectrode}
                addDisabled={createElectrode.isPending}
              />

              {/* Active electrode content */}
              {activeElectrode ? (
                <ElectrodeCard
                  key={activeElectrode.id}
                  electrode={activeElectrode}
                  onUpdate={(updates) => updateElectrode.mutate({ id: activeElectrode.id, ...updates })}
                  onDelete={() => {
                    deleteElectrode.mutate({ id: activeElectrode.id, sessionId: session!.id });
                    const remaining = electrodes.filter((e: any) => e.id !== activeElectrode.id);
                    setActiveElectrodeId(remaining.length > 0 ? remaining[0].id : null);
                  }}
                />
              ) : (
                <div className="rounded-xl border border-dashed border-border p-12 text-center">
                  <Ruler className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">Nog geen elektrodes</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Voeg een elektrode toe om te beginnen met meten</p>
                </div>
              )}

              {/* Sketch section */}
              <SketchAttachmentsSection projectId={id!} tenantId={tenantId} sessionId={session?.id} />
            </>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4 lg:sticky lg:top-16 lg:self-start">
          <ReadinessChecklist items={readinessItems} />
        </div>
      </div>
    </div>
  );
}
