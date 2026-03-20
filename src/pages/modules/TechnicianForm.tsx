import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { FormSection } from '@/components/ui/form-section';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useTechnician, useCreateTechnician, useUpdateTechnician } from '@/hooks/use-technicians';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';

export default function TechnicianForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  const { data: existing } = useTechnician(id);
  const createMut = useCreateTechnician();
  const updateMut = useUpdateTechnician();

  const [form, setForm] = useState({ full_name: '', email: '', phone: '', employee_code: '', is_active: true });

  useEffect(() => {
    if (existing) setForm({
      full_name: existing.full_name, email: existing.email || '', phone: existing.phone || '',
      employee_code: existing.employee_code || '', is_active: existing.is_active,
    });
  }, [existing]);

  const set = (k: string, v: string | boolean) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.tenant_id) return;
    const payload = { ...form, tenant_id: profile.tenant_id, email: form.email || null, phone: form.phone || null, employee_code: form.employee_code || null };
    try {
      if (isEdit) { await updateMut.mutateAsync({ id, ...payload }); toast({ title: 'Monteur bijgewerkt' }); }
      else { await createMut.mutateAsync(payload); toast({ title: 'Monteur aangemaakt' }); }
      navigate('/technicians');
    } catch (err: any) { toast({ title: 'Fout', description: err.message, variant: 'destructive' }); }
  };

  const saving = createMut.isPending || updateMut.isPending;

  return (
    <div className="animate-fade-in max-w-2xl">
      <div className="mb-4"><Button variant="ghost" size="sm" onClick={() => navigate('/technicians')}><ArrowLeft className="mr-2 h-4 w-4" /> Terug</Button></div>
      <PageHeader title={isEdit ? 'Monteur bewerken' : 'Nieuwe monteur'} />
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormSection title="Monteurgegevens">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Volledige Naam *</Label><Input value={form.full_name} onChange={e => set('full_name', e.target.value)} required /></div>
            <div className="space-y-2"><Label>Medewerkernummer</Label><Input value={form.employee_code} onChange={e => set('employee_code', e.target.value)} placeholder="bijv. TV-005" /></div>
            <div className="space-y-2"><Label>E-mail</Label><Input type="email" value={form.email} onChange={e => set('email', e.target.value)} /></div>
            <div className="space-y-2"><Label>Telefoon</Label><Input value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
          </div>
          <div className="flex items-center gap-3 pt-2"><Switch checked={form.is_active} onCheckedChange={v => set('is_active', v)} /><Label>Actief</Label></div>
        </FormSection>
        <div className="flex gap-3">
          <Button type="submit" disabled={saving}>{saving ? 'Opslaan...' : isEdit ? 'Bijwerken' : 'Monteur Aanmaken'}</Button>
          <Button type="button" variant="outline" onClick={() => navigate('/technicians')}>Annuleren</Button>
        </div>
      </form>
    </div>
  );
}
