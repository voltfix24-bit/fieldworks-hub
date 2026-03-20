import { useTenant } from '@/contexts/TenantContext';

export function ReportFooter() {
  const { tenant, branding } = useTenant();

  const company = branding?.footer_company_name || tenant?.company_name || '';
  const addressParts = [branding?.footer_address, branding?.footer_city, branding?.footer_country].filter(Boolean).join(', ');
  const contactParts = [
    branding?.footer_email,
    branding?.footer_phone && `Tel. ${branding.footer_phone}`,
    branding?.footer_website,
  ].filter(Boolean);

  return (
    <footer className="report-footer mt-auto pt-6 border-t border-foreground/10">
      <div className="flex items-end justify-between text-[9px] text-muted-foreground leading-relaxed">
        <div className="space-y-0.5">
          <p className="font-semibold text-foreground text-[10px]">{company}</p>
          {addressParts && <p>{addressParts}</p>}
          {contactParts.length > 0 && <p>{contactParts.join('  ·  ')}</p>}
        </div>
        {branding?.logo_url && (
          <img src={branding.logo_url} alt="" className="h-5 w-auto opacity-20 print:opacity-15" />
        )}
      </div>
    </footer>
  );
}
