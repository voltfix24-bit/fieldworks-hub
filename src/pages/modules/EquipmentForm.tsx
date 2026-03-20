import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { FormSection } from '@/components/ui/form-section';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useEquipment, useCreateEquipment, useUpdateEquipment } from '@/hooks/use-equipment';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';

export default function EquipmentForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  const { data: existing } = useEquipment(id);
  const createMut = useCreateEquipment();
  const updateMut = useUpdateEquipment();

  const [form, setForm] = useState({
    device_name: '', brand: '', model: '', serial_number: '',
    calibration_date: '', next_calibration_date: '',
    is_default: false, is_active: true, notes: '',
  });

  useEffect(() => {
    if (existing) setForm({
      device_name: existing.device_name, brand: existing.brand || '', model: existing.model || '',
      serial_number: existing.serial_number || '', calibration_date: existing.calibration_date || '',
      next_calibration_date: existing.next_calibration_date || '',
      is_default: existing.is_default, is_active: existing.is_active, notes: existing.notes || '',
    });
  }, [existing]);

  const set = (k: string, v: string | boolean) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.tenant_id) return;
    const payload = {
      ...form, tenant_id: profile.tenant_id, brand: form.brand || null, model: form.model || null,
      serial_number: form.serial_number || null, calibration_date: form.calibration_date || null,
      next_calibration_date: form.next_calibration_date || null, notes: form.notes || null,
    };
    try {
      if (isEdit) { await updateMut.mutateAsync({ id, ...payload }); toast({ title: 'Apparaat bijgewerkt' }); }
      else { await createMut.mutateAsync(payload); toast({ title: 'Apparaat aangemaakt' }); }
      navigate('/equipment');
    } catch (err: any) { toast({ title: 'Fout', description: err.message, variant: 'destructive' }); }
  };

  const saving = createMut.isPending || updateMut.isPending;

  return (
    <div className="animate-fade-in max-w-2xl">
      <div className="mb-4"><Button variant="ghost" size="sm" onClick={() => navigate('/equipment')}><ArrowLeft className="mr-2 h-4 w-4" /> Terug</Button></div>
      <PageHeader title={isEdit ? 'Apparaat bewerken' : 'Nieuw apparaat'} />
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormSection title="Apparaatinformatie">
          <div className="space-y-2"><Label>Apparaatnaam *</Label><Input value={form.device_name} onChange={e => set('device_name', e.target.value)} required /></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Merk</Label><Input value={form.brand} onChange={e => set('brand', e.target.value)} /></div>
            <div className="space-y-2"><Label>Model</Label><Input value={form.model} onChange={e => set('model', e.target.value)} /></div>
          </div>
          <div className="space-y-2"><Label>Serienummer</Label><Input value={form.serial_number} onChange={e => set('serial_number', e.target.value)} className="font-mono" /></div>
        </FormSection>

        <FormSection title="Kalibratie">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Laatste kalibratie</Label><Input type="date" value={form.calibration_date} onChange={e => set('calibration_date', e.target.value)} /></div>
            <div className="space-y-2"><Label>Volgende kalibratie</Label><Input type="date" value={form.next_calibration_date} onChange={e => set('next_calibration_date', e.target.value)} /></div>
          </div>
        </FormSection>

        <FormSection title="Instellingen">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Switch checked={form.is_default} onCheckedChange={v => set('is_default', v)} />
              <div><Label>Standaard Apparaat</Label><p className="text-xs text-muted-foreground">Wordt automatisch geselecteerd bij nieuwe projecten</p></div>
            </div>
            <div className="flex items-center gap-3"><Switch checked={form.is_active} onCheckedChange={v => set('is_active', v)} /><Label>Actief</Label></div>
          </div>
        </FormSection>

        <FormSection title="Notities">
          <Textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} placeholder="Interne notities..." />
        </FormSection>

        <div className="flex gap-3">
          <Button type="submit" disabled={saving}>{saving ? 'Opslaan...' : isEdit ? 'Bijwerken' : 'Apparaat Aanmaken'}</Button>
          <Button type="button" variant="outline" onClick={() => navigate('/equipment')}>Annuleren</Button>
        </div>
      </form>
    </div>
  );
}
