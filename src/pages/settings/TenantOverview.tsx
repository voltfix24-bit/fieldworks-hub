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
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const startEdit = () => {
    setName(tenant?.company_name || '');
    setEditing(true);
  };

  const cancel = () => setEditing(false);

  const save = async () => {
    if (!tenant || !name.trim()) return;
    setSaving(true);
    const { data, error } = await supabase
      .from('tenants')
      .update({ company_name: name.trim() })
      .eq('id', tenant.id)
      .select()
      .single();
    if (error) {
      toast({ title: 'Opslaan mislukt', description: error.message, variant: 'destructive' });
    } else if (!data) {
      toast({ title: 'Opslaan mislukt', description: 'Geen wijziging doorgevoerd. Mogelijk ontbreken de juiste rechten.', variant: 'destructive' });
    } else {
      toast({ title: 'Bedrijfsnaam bijgewerkt' });
      await refetchBranding();
      setEditing(false);
    }
    setSaving(false);
  };

  return (
    <div className="animate-fade-in max-w-2xl">
      <PageHeader title="Bedrijfsoverzicht" description="Bedrijfsgegevens en status" />

      <Card className="mb-6">
        <CardHeader><CardTitle className="text-base">Bedrijfsinformatie</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center py-3 border-b border-border">
            <span className="text-sm font-medium text-muted-foreground sm:w-40 shrink-0">Bedrijfsnaam</span>
            {editing ? (
              <div className="flex items-center gap-2 flex-1 mt-1 sm:mt-0">
                <Input value={name} onChange={e => setName(e.target.value)} className="h-8 text-sm" autoFocus onKeyDown={e => e.key === 'Enter' && save()} />
                <Button size="icon" variant="ghost" className="h-8 w-8 text-primary" onClick={save} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={cancel} disabled={saving}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-1 mt-1 sm:mt-0">
                <span className="text-sm text-foreground">{tenant?.company_name || '—'}</span>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={startEdit}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
          <InfoRow label="Slug" value={tenant?.slug} />
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
