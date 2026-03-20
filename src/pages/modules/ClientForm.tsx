import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { FormSection } from '@/components/ui/form-section';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useClient, useCreateClient, useUpdateClient } from '@/hooks/use-clients';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';

export default function ClientForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  const { data: existing } = useClient(id);
  const createMutation = useCreateClient();
  const updateMutation = useUpdateClient();

  const [form, setForm] = useState({
    company_name: '', contact_name: '', email: '', phone: '',
    address_line_1: '', address_line_2: '', postal_code: '', city: '', country: '',
    notes: '', is_active: true,
  });

  useEffect(() => {
    if (existing) setForm({
      company_name: existing.company_name,
      contact_name: existing.contact_name || '', email: existing.email || '',
      phone: existing.phone || '', address_line_1: existing.address_line_1 || '',
      address_line_2: existing.address_line_2 || '', postal_code: existing.postal_code || '',
      city: existing.city || '', country: existing.country || '',
      notes: existing.notes || '', is_active: existing.is_active,
    });
  }, [existing]);

  const set = (key: string, value: string | boolean) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.tenant_id) return;
    const payload = {
      ...form, tenant_id: profile.tenant_id,
      contact_name: form.contact_name || null, email: form.email || null,
      phone: form.phone || null, address_line_1: form.address_line_1 || null,
      address_line_2: form.address_line_2 || null, postal_code: form.postal_code || null,
      city: form.city || null, country: form.country || null, notes: form.notes || null,
    };
    try {
      if (isEdit) { await updateMutation.mutateAsync({ id, ...payload }); toast({ title: 'Klant bijgewerkt' }); }
      else { await createMutation.mutateAsync(payload); toast({ title: 'Klant aangemaakt' }); }
      navigate('/clients');
    } catch (err: any) { toast({ title: 'Fout', description: err.message, variant: 'destructive' }); }
  };

  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="animate-fade-in max-w-2xl">
      <div className="mb-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/clients')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Terug naar Klanten
        </Button>
      </div>
      <PageHeader title={isEdit ? 'Klant bewerken' : 'Nieuwe klant'} />
      <form onSubmit={handleSubmit} className="space-y-6">
        <FormSection title="Bedrijfsgegevens">
          <div className="space-y-2">
            <Label>Bedrijfsnaam *</Label>
            <Input value={form.company_name} onChange={e => set('company_name', e.target.value)} required />
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={form.is_active} onCheckedChange={v => set('is_active', v)} />
            <Label>Actief</Label>
          </div>
        </FormSection>

        <FormSection title="Contactgegevens">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Contactpersoon</Label><Input value={form.contact_name} onChange={e => set('contact_name', e.target.value)} /></div>
            <div className="space-y-2"><Label>E-mail</Label><Input type="email" value={form.email} onChange={e => set('email', e.target.value)} /></div>
            <div className="space-y-2 sm:col-span-2"><Label>Telefoon</Label><Input value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
          </div>
        </FormSection>

        <FormSection title="Adres">
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

        <FormSection title="Notities">
          <Textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} placeholder="Interne notities..." />
        </FormSection>

        <div className="flex gap-3">
          <Button type="submit" disabled={saving}>{saving ? 'Opslaan...' : isEdit ? 'Klant Bijwerken' : 'Klant Aanmaken'}</Button>
          <Button type="button" variant="outline" onClick={() => navigate('/clients')}>Annuleren</Button>
        </div>
      </form>
    </div>
  );
}
