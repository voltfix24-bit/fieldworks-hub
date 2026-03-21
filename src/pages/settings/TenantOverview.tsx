import { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InfoRow } from '@/components/ui/info-row';
import { StatusBadge } from '@/components/ui/status-badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useTenant } from '@/contexts/TenantContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Pencil, Check, X, Loader2 } from 'lucide-react';

export default function TenantOverview() {
  const { tenant, branding, refetchBranding } = useTenant();
  const { toast } = useToast();
  const [editingField, setEditingField] = useState<'name' | 'slug' | null>(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [saving, setSaving] = useState(false);

  const startEdit = (field: 'name' | 'slug') => {
    if (field === 'name') setName(tenant?.company_name || '');
    if (field === 'slug') setSlug(tenant?.slug || '');
    setEditingField(field);
  };

  const cancel = () => setEditingField(null);

  const save = async () => {
    if (!tenant) return;
    const updates: Record<string, string> = {};
    if (editingField === 'name' && name.trim()) updates.company_name = name.trim();
    if (editingField === 'slug' && slug.trim()) updates.slug = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
    if (Object.keys(updates).length === 0) return;

    setSaving(true);
    const { error } = await supabase
      .from('tenants')
      .update(updates)
      .eq('id', tenant.id);
    if (error) {
      toast({ title: 'Opslaan mislukt', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: editingField === 'name' ? 'Bedrijfsnaam bijgewerkt' : 'Slug bijgewerkt' });
      await refetchBranding();
      setEditingField(null);
    }
    setSaving(false);
  };

  const renderEditableRow = (label: string, field: 'name' | 'slug', value: string | undefined, inputValue: string, setInputValue: (v: string) => void) => (
    <div className="flex flex-col sm:flex-row sm:items-center py-3 border-b border-border">
      <span className="text-sm font-medium text-muted-foreground sm:w-40 shrink-0">{label}</span>
      {editingField === field ? (
        <div className="flex items-center gap-2 flex-1 mt-1 sm:mt-0">
          <Input value={inputValue} onChange={e => setInputValue(e.target.value)} className="h-8 text-sm" autoFocus onKeyDown={e => e.key === 'Enter' && save()} />
          <Button size="icon" variant="ghost" className="h-8 w-8 text-primary" onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={cancel} disabled={saving}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2 flex-1 mt-1 sm:mt-0">
          <span className="text-sm text-foreground">{value || '—'}</span>
          <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => startEdit(field)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div className="animate-fade-in max-w-2xl">
      <PageHeader title="Bedrijfsoverzicht" description="Bedrijfsgegevens en status" />

      <Card className="mb-6">
        <CardHeader><CardTitle className="text-base">Bedrijfsinformatie</CardTitle></CardHeader>
        <CardContent>
          {renderEditableRow('Bedrijfsnaam', 'name', tenant?.company_name, name, setName)}
          {renderEditableRow('Slug', 'slug', tenant?.slug, slug, setSlug)}
          <div className="flex flex-col sm:flex-row sm:items-center py-3 border-b border-border">
            <span className="text-sm font-medium text-muted-foreground sm:w-40 shrink-0">Status</span>
            <StatusBadge status={tenant?.status || 'active'} />
          </div>
          <InfoRow label="Aangemaakt" value={tenant?.created_at ? new Date(tenant.created_at).toLocaleDateString('nl-NL') : undefined} />
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader><CardTitle className="text-base">Ondersteuning & Contact</CardTitle></CardHeader>
        <CardContent>
          <InfoRow label="Support E-mail" value={branding?.support_email} />
          <InfoRow label="Support Telefoon" value={branding?.support_phone} />
          <InfoRow label="Website" value={branding?.website} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Huisstijl Samenvatting</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 py-3 border-b border-border">
            <span className="text-sm font-medium text-muted-foreground w-40 shrink-0">Kleuren</span>
            <div className="flex gap-2">
              {[branding?.primary_color, branding?.secondary_color, branding?.accent_color].map((color, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className="h-5 w-5 rounded-md border border-border" style={{ backgroundColor: color || '#ccc' }} />
                  <span className="text-xs text-muted-foreground">{color || '—'}</span>
                </div>
              ))}
            </div>
          </div>
          <InfoRow label="Logo" value={branding?.logo_url ? 'Geüpload' : 'Niet ingesteld'} />
          <InfoRow label="Voettekst Bedrijf" value={branding?.footer_company_name} />
        </CardContent>
      </Card>
    </div>
  );
}
