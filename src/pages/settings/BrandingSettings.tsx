import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useTenant } from '@/contexts/TenantContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Building2, Upload, Trash2 } from 'lucide-react';

export default function BrandingSettings() {
  const { tenant, branding, refetchBranding } = useTenant();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    primary_color: '#1e40af', secondary_color: '#64748b', accent_color: '#0ea5e9',
    logo_url: '' as string, support_email: '', support_phone: '', website: '',
    footer_company_name: '', footer_address: '', footer_city: '', footer_country: '',
    footer_email: '', footer_phone: '', footer_website: '',
  });

  useEffect(() => {
    if (branding) setForm({
      primary_color: branding.primary_color, secondary_color: branding.secondary_color,
      accent_color: branding.accent_color, logo_url: branding.logo_url || '',
      support_email: branding.support_email || '', support_phone: branding.support_phone || '',
      website: branding.website || '', footer_company_name: branding.footer_company_name || '',
      footer_address: branding.footer_address || '', footer_city: branding.footer_city || '',
      footer_country: branding.footer_country || '', footer_email: branding.footer_email || '',
      footer_phone: branding.footer_phone || '', footer_website: branding.footer_website || '',
    });
  }, [branding]);

  const updateField = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !tenant) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${tenant.id}/logo_${Date.now()}.${ext}`;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'Bestand te groot', description: 'Maximaal 10MB toegestaan.', variant: 'destructive' });
      setUploading(false);
      return;
    }
    const { error } = await supabase.storage.from('tenant-assets').upload(path, file, { upsert: true });
    if (error) {
      toast({ title: 'Upload mislukt', description: error.message, variant: 'destructive' });
    } else {
      const { data: { publicUrl } } = supabase.storage.from('tenant-assets').getPublicUrl(path);
      updateField('logo_url', publicUrl);
      toast({ title: 'Logo geüpload' });
    }
    setUploading(false);
  };

  const handleRemoveLogo = () => {
    updateField('logo_url', '');
  };

  const handleSave = async () => {
    if (!tenant) return;
    setSaving(true);
    const payload = {
      ...form,
      logo_url: form.logo_url || null, support_email: form.support_email || null,
      support_phone: form.support_phone || null, website: form.website || null,
      footer_company_name: form.footer_company_name || null, footer_address: form.footer_address || null,
      footer_city: form.footer_city || null, footer_country: form.footer_country || null,
      footer_email: form.footer_email || null, footer_phone: form.footer_phone || null,
      footer_website: form.footer_website || null,
    };

    if (branding) {
      const { error } = await supabase.from('tenant_branding').update(payload).eq('tenant_id', tenant.id);
      if (error) { toast({ title: 'Fout', description: error.message, variant: 'destructive' }); }
      else { toast({ title: 'Huisstijl opgeslagen' }); await refetchBranding(); }
    } else {
      const { error } = await supabase.from('tenant_branding').insert({ ...payload, tenant_id: tenant.id });
      if (error) { toast({ title: 'Fout', description: error.message, variant: 'destructive' }); }
      else { toast({ title: 'Huisstijl aangemaakt' }); await refetchBranding(); }
    }
    setSaving(false);
  };

  return (
    <div className="animate-fade-in max-w-4xl">
      <PageHeader title="Huisstijl Instellingen" description="Pas de visuele identiteit van uw bedrijf aan"
        action={<Button onClick={handleSave} disabled={saving}>{saving ? 'Opslaan...' : 'Wijzigingen Opslaan'}</Button>} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Logo</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                {form.logo_url ? (
                  <img src={form.logo_url} alt="Logo" className="h-16 w-16 rounded-lg object-contain border border-border" />
                ) : (
                  <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center"><Building2 className="h-8 w-8 text-muted-foreground" /></div>
                )}
                <div>
                  <div className="flex gap-2">
                    <Label htmlFor="logo-upload" className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg text-sm font-medium transition-colors">
                      <Upload className="h-4 w-4" />{uploading ? 'Uploaden...' : 'Logo Uploaden'}
                    </Label>
                    {form.logo_url && (
                      <Button variant="outline" size="sm" onClick={handleRemoveLogo}><Trash2 className="h-4 w-4" /></Button>
                    )}
                  </div>
                  <input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                  <p className="text-xs text-muted-foreground mt-1">PNG, JPG of SVG. Max 10MB.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Merkkleueren</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: 'primary_color', label: 'Primaire Kleur' },
                { key: 'secondary_color', label: 'Secundaire Kleur' },
                { key: 'accent_color', label: 'Accentkleur' },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center gap-3">
                  <input type="color" value={form[key as keyof typeof form]} onChange={(e) => updateField(key, e.target.value)} className="h-10 w-10 rounded-md border border-border cursor-pointer" />
                  <div className="flex-1"><Label className="text-sm">{label}</Label><Input value={form[key as keyof typeof form]} onChange={(e) => updateField(key, e.target.value)} className="mt-1" placeholder="#000000" /></div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Ondersteuning & Contact</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {[
                { key: 'support_email', label: 'Support E-mail', placeholder: 'support@bedrijf.nl' },
                { key: 'support_phone', label: 'Support Telefoon', placeholder: '+31 20 123 4567' },
                { key: 'website', label: 'Website', placeholder: 'https://bedrijf.nl' },
              ].map(({ key, label, placeholder }) => (
                <div key={key} className="space-y-1"><Label className="text-sm">{label}</Label><Input value={form[key as keyof typeof form]} onChange={(e) => updateField(key, e.target.value)} placeholder={placeholder} /></div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Rapportvoettekst</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {[
                { key: 'footer_company_name', label: 'Bedrijfsnaam', placeholder: 'Bedrijf BV' },
                { key: 'footer_address', label: 'Adres', placeholder: 'Straat 123' },
                { key: 'footer_city', label: 'Plaats', placeholder: 'Amsterdam' },
                { key: 'footer_country', label: 'Land', placeholder: 'Nederland' },
                { key: 'footer_email', label: 'E-mail', placeholder: 'info@bedrijf.nl' },
                { key: 'footer_phone', label: 'Telefoon', placeholder: '+31 20 123 4567' },
                { key: 'footer_website', label: 'Website', placeholder: 'https://bedrijf.nl' },
              ].map(({ key, label, placeholder }) => (
                <div key={key} className="space-y-1"><Label className="text-sm">{label}</Label><Input value={form[key as keyof typeof form]} onChange={(e) => updateField(key, e.target.value)} placeholder={placeholder} /></div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="sticky top-4">
            <CardHeader><CardTitle className="text-base">Live Voorbeeld</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-medium">App Header</p>
                <div className="rounded-lg border border-border overflow-hidden">
                  <div className="h-12 flex items-center px-4 gap-3" style={{ backgroundColor: form.primary_color }}>
                    {form.logo_url ? <img src={form.logo_url} alt="" className="h-7 w-7 rounded object-contain" /> : <div className="h-7 w-7 rounded bg-white/20 flex items-center justify-center"><Building2 className="h-4 w-4 text-white" /></div>}
                    <span className="text-sm font-medium text-white">{form.footer_company_name || tenant?.company_name || 'Bedrijfsnaam'}</span>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-medium">Knoppen</p>
                <div className="flex flex-wrap gap-2">
                  <button className="px-4 py-2 rounded-md text-sm font-medium text-white" style={{ backgroundColor: form.primary_color }}>Primair</button>
                  <button className="px-4 py-2 rounded-md text-sm font-medium text-white" style={{ backgroundColor: form.secondary_color }}>Secundair</button>
                  <button className="px-4 py-2 rounded-md text-sm font-medium text-white" style={{ backgroundColor: form.accent_color }}>Accent</button>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-medium">Rapport Kop / Voet</p>
                <div className="rounded-lg border border-border overflow-hidden">
                  <div className="px-4 py-3 flex items-center justify-between" style={{ backgroundColor: form.primary_color }}>
                    <div className="flex items-center gap-2">
                      {form.logo_url ? <img src={form.logo_url} alt="" className="h-6 w-6 rounded object-contain" /> : <Building2 className="h-5 w-5 text-white" />}
                      <span className="text-sm font-semibold text-white">{form.footer_company_name || tenant?.company_name || 'Bedrijf'}</span>
                    </div>
                    <span className="text-xs text-white/70">Meetrapport</span>
                  </div>
                  <div className="p-4 bg-card"><div className="h-2 bg-muted rounded w-3/4 mb-2" /><div className="h-2 bg-muted rounded w-1/2 mb-2" /><div className="h-2 bg-muted rounded w-2/3" /></div>
                  <div className="px-4 py-2 border-t border-border bg-muted">
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
                      {form.footer_company_name && <span>{form.footer_company_name}</span>}
                      {form.footer_address && <span>{form.footer_address}</span>}
                      {form.footer_city && <span>{form.footer_city}</span>}
                      {form.footer_country && <span>{form.footer_country}</span>}
                      {form.footer_email && <span>{form.footer_email}</span>}
                      {form.footer_phone && <span>{form.footer_phone}</span>}
                      {!form.footer_company_name && !form.footer_address && <span className="italic">Voettekstgegevens verschijnen hier</span>}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
