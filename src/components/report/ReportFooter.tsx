import { useTenant } from '@/contexts/TenantContext';

export function ReportFooter() {
  const { tenant, branding } = useTenant();

  const footerCompany = branding?.footer_company_name || tenant?.company_name || '';
  const footerParts = [
    branding?.footer_address,
    branding?.footer_city,
    branding?.footer_country,
  ].filter(Boolean).join(', ');
  const contactParts = [
    branding?.footer_email && `E-mail: ${branding.footer_email}`,
    branding?.footer_phone && `Tel.: ${branding.footer_phone}`,
    branding?.footer_website && branding.footer_website,
  ].filter(Boolean);

  return (
    <div className="report-footer mt-12 pt-4 border-t-2" style={{ borderColor: `hsl(var(--tenant-primary))` }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-foreground">{footerCompany}</p>
          {footerParts && <p className="text-[10px] text-muted-foreground">{footerParts}</p>}
          {contactParts.length > 0 && (
            <p className="text-[10px] text-muted-foreground">{contactParts.join(' · ')}</p>
          )}
        </div>
        {branding?.logo_url && (
          <img src={branding.logo_url} alt="" className="h-8 w-auto opacity-40" />
        )}
      </div>
    </div>
  );
}
