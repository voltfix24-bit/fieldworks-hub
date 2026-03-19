import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProject, useCreateProject, useUpdateProject } from '@/hooks/use-projects';
import { useClients } from '@/hooks/use-clients';
import { useTechnicians } from '@/hooks/use-technicians';
import { useEquipmentList, useDefaultEquipment } from '@/hooks/use-equipment';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ProjectForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  const { data: existing } = useProject(id);
  const { data: defaultEquipment } = useDefaultEquipment();
  const { data: clients } = useClients();
  const { data: technicians } = useTechnicians();
  const { data: equipment } = useEquipmentList();
  const createMut = useCreateProject();
  const updateMut = useUpdateProject();

  const activeClients = clients?.filter(c => c.is_active) ?? [];
  const activeTechs = technicians?.filter(t => t.is_active) ?? [];
  const activeEquip = equipment?.filter(e => e.is_active) ?? [];
  const defaultTech = activeTechs.find(t => t.is_default);

  const [form, setForm] = useState({
    project_number: '', project_name: '', site_name: '',
    address_line_1: '', postal_code: '', city: '',
    planned_date: '',
    client_id: '', technician_id: '', equipment_id: '', notes: '',
  });

  const [defaultsApplied, setDefaultsApplied] = useState(false);
  const [showExtra, setShowExtra] = useState(false);

  // Apply defaults for new projects
  useEffect(() => {
    if (!isEdit && !defaultsApplied) {
      const updates: Partial<typeof form> = {};
      if (defaultEquipment) updates.equipment_id = defaultEquipment.id;
      if (defaultTech) updates.technician_id = defaultTech.id;
      if (Object.keys(updates).length > 0) {
        setForm(prev => ({ ...prev, ...updates }));
        setDefaultsApplied(true);
      }
    }
  }, [defaultEquipment, defaultTech, isEdit, defaultsApplied]);

  // Populate form for editing
  useEffect(() => {
    if (existing) {
      setForm({
        project_number: existing.project_number, project_name: existing.project_name,
        site_name: existing.site_name || '', address_line_1: existing.address_line_1 || '',
        postal_code: existing.postal_code || '', city: existing.city || '',
        planned_date: existing.planned_date || '',
        client_id: existing.client_id || '', technician_id: existing.technician_id || '',
        equipment_id: existing.equipment_id || '', notes: existing.notes || '',
      });
      // Show extra section if there's existing data in optional fields
      if (existing.site_name || existing.notes) setShowExtra(true);
    }
  }, [existing]);

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.tenant_id) return;
    const payload = {
      tenant_id: profile.tenant_id,
      project_number: form.project_number,
      project_name: form.project_name,
      site_name: form.site_name || null,
      address_line_1: form.address_line_1 || null,
      address_line_2: null,
      postal_code: form.postal_code || null,
      city: form.city || null,
      country: null,
      planned_date: form.planned_date || null,
      status: 'planned' as const,
      client_id: form.client_id || null,
      technician_id: form.technician_id || null,
      equipment_id: form.equipment_id || null,
      notes: form.notes || null,
    };
    try {
      if (isEdit) {
        await updateMut.mutateAsync({ id, ...payload, status: existing?.status || 'planned' });
        toast({ title: 'Project bijgewerkt' });
      } else {
        await createMut.mutateAsync(payload);
        toast({ title: 'Project aangemaakt' });
      }
      navigate('/projects');
    } catch (err: any) {
      toast({ title: 'Fout', description: err.message, variant: 'destructive' });
    }
  };

  const saving = createMut.isPending || updateMut.isPending;

  return (
    <div className="animate-fade-in max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="h-9 w-9 rounded-xl bg-muted/40 hover:bg-muted/70 flex items-center justify-center transition-colors shrink-0"
        >
          <ArrowLeft className="h-4 w-4 text-muted-foreground" />
        </button>
        <div>
          <h1 className="text-[17px] font-bold text-foreground tracking-tight">
            {isEdit ? 'Project bewerken' : 'Nieuw project'}
          </h1>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            {isEdit ? 'Pas de projectgegevens aan' : 'Vul de basisgegevens in om te starten'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* ─── Essential fields ─── */}
        <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
          <div className="p-4 space-y-4">
            {/* Project number + name */}
            <div className="grid grid-cols-[120px_1fr] gap-3">
              <Field label="Nummer" required>
                <Input
                  value={form.project_number}
                  onChange={e => set('project_number', e.target.value)}
                  required
                  placeholder="TV-2026-005"
                  className="h-10 text-[13px] font-mono"
                />
              </Field>
              <Field label="Projectnaam" required>
                <Input
                  value={form.project_name}
                  onChange={e => set('project_name', e.target.value)}
                  required
                  placeholder="Naam van het project"
                  className="h-10 text-[13px]"
                />
              </Field>
            </div>

            {/* Location: address + postal + city in one row group */}
            <Field label="Locatie">
              <Input
                value={form.address_line_1}
                onChange={e => set('address_line_1', e.target.value)}
                placeholder="Straat en huisnummer"
                className="h-10 text-[13px] rounded-b-none border-b-0"
              />
              <div className="grid grid-cols-[100px_1fr] ">
                <Input
                  value={form.postal_code}
                  onChange={e => set('postal_code', e.target.value)}
                  placeholder="Postcode"
                  className="h-10 text-[13px] rounded-t-none rounded-br-none border-r-0"
                />
                <Input
                  value={form.city}
                  onChange={e => set('city', e.target.value)}
                  placeholder="Plaats"
                  className="h-10 text-[13px] rounded-t-none rounded-bl-none"
                />
              </div>
            </Field>

            {/* Date */}
            <Field label="Datum">
              <Input
                type="date"
                value={form.planned_date}
                onChange={e => set('planned_date', e.target.value)}
                className="h-10 text-[13px]"
              />
            </Field>
          </div>

          {/* Divider */}
          <div className="h-px bg-border/40" />

          {/* Assignments */}
          <div className="p-4 space-y-4">
            <Field label="Opdrachtgever">
              <Select value={form.client_id || 'none'} onValueChange={v => set('client_id', v === 'none' ? '' : v)}>
                <SelectTrigger className="h-10 text-[13px]"><SelectValue placeholder="Selecteer..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Geen —</SelectItem>
                  {activeClients.map(c => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Monteur">
                <Select value={form.technician_id || 'none'} onValueChange={v => set('technician_id', v === 'none' ? '' : v)}>
                  <SelectTrigger className="h-10 text-[13px]"><SelectValue placeholder="Selecteer..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Geen —</SelectItem>
                    {activeTechs.map(t => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.full_name}{t.is_default ? ' ★' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Apparatuur">
                <Select value={form.equipment_id || 'none'} onValueChange={v => set('equipment_id', v === 'none' ? '' : v)}>
                  <SelectTrigger className="h-10 text-[13px]"><SelectValue placeholder="Selecteer..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Geen —</SelectItem>
                    {activeEquip.map(e => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.device_name}{e.is_default ? ' ★' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </div>
        </div>

        {/* ─── Collapsible extra section ─── */}
        <div className="rounded-2xl border border-border/30 bg-card/50 overflow-hidden">
          <button
            type="button"
            onClick={() => setShowExtra(!showExtra)}
            className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/10 transition-colors"
          >
            <span className="text-[12px] font-medium text-muted-foreground">
              Extra gegevens
            </span>
            <ChevronDown className={cn(
              'h-3.5 w-3.5 text-muted-foreground/40 transition-transform duration-200',
              showExtra && 'rotate-180'
            )} />
          </button>
          {showExtra && (
            <div className="px-4 pb-4 space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
              <Field label="Locatienaam">
                <Input
                  value={form.site_name}
                  onChange={e => set('site_name', e.target.value)}
                  placeholder="Gebouw of terrein"
                  className="h-10 text-[13px]"
                />
              </Field>
              <Field label="Notities">
                <Textarea
                  value={form.notes}
                  onChange={e => set('notes', e.target.value)}
                  placeholder="Eventuele opmerkingen..."
                  className="text-[13px] min-h-[72px] resize-none"
                />
              </Field>
            </div>
          )}
        </div>

        {/* ─── Actions ─── */}
        <div className="flex gap-2.5 pt-1">
          <Button
            type="submit"
            disabled={saving}
            className="flex-1 h-11 text-[13px] font-semibold"
          >
            {saving ? 'Opslaan...' : isEdit ? 'Opslaan' : 'Project aanmaken'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(-1)}
            className="h-11 px-5 text-[13px]"
          >
            Annuleren
          </Button>
        </div>
      </form>
    </div>
  );
}

/** Compact field wrapper */
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider">
        {label}
        {required && <span className="text-destructive/60 ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  );
}
