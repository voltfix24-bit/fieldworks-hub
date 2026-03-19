import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { FormSection } from '@/components/ui/form-section';
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
import { ArrowLeft } from 'lucide-react';

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

  const [form, setForm] = useState({
    project_number: '', project_name: '', site_name: '',
    address_line_1: '', address_line_2: '', postal_code: '', city: '', country: '',
    planned_date: '', status: 'planned' as 'planned' | 'completed',
    client_id: '', technician_id: '', equipment_id: '', notes: '',
  });

  const [defaultApplied, setDefaultApplied] = useState(false);

  useEffect(() => {
    if (!isEdit && defaultEquipment && !defaultApplied) {
      setForm(prev => ({ ...prev, equipment_id: defaultEquipment.id }));
      setDefaultApplied(true);
    }
  }, [defaultEquipment, isEdit, defaultApplied]);

  useEffect(() => {
    if (existing) setForm({
      project_number: existing.project_number, project_name: existing.project_name,
      site_name: existing.site_name || '', address_line_1: existing.address_line_1 || '',
      address_line_2: existing.address_line_2 || '', postal_code: existing.postal_code || '',
      city: existing.city || '', country: existing.country || '',
      planned_date: existing.planned_date || '', status: existing.status,
      client_id: existing.client_id || '', technician_id: existing.technician_id || '',
      equipment_id: existing.equipment_id || '', notes: existing.notes || '',
    });
  }, [existing]);

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.tenant_id) return;
    const payload = {
      tenant_id: profile.tenant_id, project_number: form.project_number, project_name: form.project_name,
      site_name: form.site_name || null, address_line_1: form.address_line_1 || null,
      address_line_2: form.address_line_2 || null, postal_code: form.postal_code || null,
      city: form.city || null, country: form.country || null, planned_date: form.planned_date || null,
      status: form.status as 'planned' | 'completed',
      client_id: form.client_id || null, technician_id: form.technician_id || null,
      equipment_id: form.equipment_id || null, notes: form.notes || null,
    };
    try {
      if (isEdit) { await updateMut.mutateAsync({ id, ...payload }); toast({ title: 'Project bijgewerkt' }); }
      else { await createMut.mutateAsync(payload); toast({ title: 'Project aangemaakt' }); }
      navigate('/projects');
    } catch (err: any) { toast({ title: 'Fout', description: err.message, variant: 'destructive' }); }
  };

  const saving = createMut.isPending || updateMut.isPending;

  return (
    <div className="animate-fade-in max-w-2xl">
      <div className="mb-4"><Button variant="ghost" size="sm" onClick={() => navigate('/projects')}><ArrowLeft className="mr-2 h-4 w-4" /> Terug</Button></div>
      <PageHeader title={isEdit ? 'Project Bewerken' : 'Nieuw Project'} />
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormSection title="Projectinformatie">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Projectnummer *</Label>
              <Input value={form.project_number} onChange={e => set('project_number', e.target.value)} required placeholder="bijv. TV-2026-005" className="font-mono" />
            </div>
            <div className="space-y-2">
              <Label>Projectnaam *</Label>
              <Input value={form.project_name} onChange={e => set('project_name', e.target.value)} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Locatienaam</Label>
            <Input value={form.site_name} onChange={e => set('site_name', e.target.value)} placeholder="Gebouw of locatie" />
          </div>
        </FormSection>

        <FormSection title="Locatie">
          <div className="space-y-4">
            <div className="space-y-2"><Label>Adresregel 1</Label><Input value={form.address_line_1} onChange={e => set('address_line_1', e.target.value)} /></div>
            <div className="space-y-2"><Label>Adresregel 2</Label><Input value={form.address_line_2} onChange={e => set('address_line_2', e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Postcode</Label><Input value={form.postal_code} onChange={e => set('postal_code', e.target.value)} /></div>
              <div className="space-y-2"><Label>Plaats</Label><Input value={form.city} onChange={e => set('city', e.target.value)} /></div>
            </div>
            <div className="space-y-2"><Label>Land</Label><Input value={form.country} onChange={e => set('country', e.target.value)} /></div>
          </div>
        </FormSection>

        <FormSection title="Planning & Status">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Geplande Datum</Label><Input type="date" value={form.planned_date} onChange={e => set('planned_date', e.target.value)} /></div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="planned">Gepland</SelectItem>
                  <SelectItem value="completed">Afgerond</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </FormSection>

        <FormSection title="Koppelingen">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Klant</Label>
              <Select value={form.client_id || "none"} onValueChange={v => set('client_id', v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Selecteer klant..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Geen</SelectItem>
                  {activeClients.map(c => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Monteur</Label>
              <Select value={form.technician_id || "none"} onValueChange={v => set('technician_id', v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Selecteer monteur..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Geen</SelectItem>
                  {activeTechs.map(t => <SelectItem key={t.id} value={t.id}>{t.full_name} {t.employee_code ? `(${t.employee_code})` : ''}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Apparatuur</Label>
              <Select value={form.equipment_id || "none"} onValueChange={v => set('equipment_id', v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Selecteer apparatuur..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Geen</SelectItem>
                  {activeEquip.map(e => <SelectItem key={e.id} value={e.id}>{e.device_name} {e.is_default ? '⭐' : ''} — {e.brand} {e.model}</SelectItem>)}
                </SelectContent>
              </Select>
              {!isEdit && defaultEquipment && form.equipment_id === defaultEquipment.id && (
                <p className="text-xs text-muted-foreground">Automatisch geselecteerd: standaard apparaat</p>
              )}
            </div>
          </div>
        </FormSection>

        <FormSection title="Notities">
          <Textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} placeholder="Projectnotities..." />
        </FormSection>

        <div className="flex gap-3">
          <Button type="submit" disabled={saving}>{saving ? 'Opslaan...' : isEdit ? 'Project Bijwerken' : 'Project Aanmaken'}</Button>
          <Button type="button" variant="outline" onClick={() => navigate('/projects')}>Annuleren</Button>
        </div>
      </form>
    </div>
  );
}
