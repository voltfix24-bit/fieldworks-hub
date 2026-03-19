import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InfoRow } from '@/components/ui/info-row';
import { StatusBadge } from '@/components/ui/status-badge';
import { useTenant } from '@/contexts/TenantContext';

export default function TenantOverview() {
  const { tenant, branding } = useTenant();

  return (
    <div className="animate-fade-in max-w-2xl">
      <PageHeader title="Tenant Overview" description="Company details and status" />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Company Information</CardTitle>
        </CardHeader>
        <CardContent>
          <InfoRow label="Company Name" value={tenant?.company_name} />
          <InfoRow label="Slug" value={tenant?.slug} />
          <div className="flex flex-col sm:flex-row sm:items-center py-3 border-b border-border">
            <span className="text-sm font-medium text-muted-foreground sm:w-40 shrink-0">Status</span>
            <StatusBadge status={tenant?.status || 'active'} />
          </div>
          <InfoRow label="Created" value={tenant?.created_at ? new Date(tenant.created_at).toLocaleDateString() : undefined} />
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Support & Contact</CardTitle>
        </CardHeader>
        <CardContent>
          <InfoRow label="Support Email" value={branding?.support_email} />
          <InfoRow label="Support Phone" value={branding?.support_phone} />
          <InfoRow label="Website" value={branding?.website} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Branding Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 py-3 border-b border-border">
            <span className="text-sm font-medium text-muted-foreground w-40 shrink-0">Colors</span>
            <div className="flex gap-2">
              {[branding?.primary_color, branding?.secondary_color, branding?.accent_color].map((color, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <div className="h-5 w-5 rounded-md border border-border" style={{ backgroundColor: color || '#ccc' }} />
                  <span className="text-xs text-muted-foreground">{color || '—'}</span>
                </div>
              ))}
            </div>
          </div>
          <InfoRow label="Logo" value={branding?.logo_url ? 'Uploaded' : 'Not set'} />
          <InfoRow label="Footer Company" value={branding?.footer_company_name} />
        </CardContent>
      </Card>
    </div>
  );
}
