import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InfoRow } from '@/components/ui/info-row';
import { StatusBadge } from '@/components/ui/status-badge';
import { useTenant } from '@/contexts/TenantContext';

export default function TenantOverview() {
  const { tenant, branding } = useTenant();

  return (
    <div className="animate-fade-in max-w-2xl">
      <PageHeader title="Bedrijfsoverzicht" description="Bedrijfsgegevens en status" />

      <Card className="mb-6">
        <CardHeader><CardTitle className="text-base">Bedrijfsinformatie</CardTitle></CardHeader>
        <CardContent>
          <InfoRow label="Bedrijfsnaam" value={tenant?.company_name} />
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
