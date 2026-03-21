import { useTenant } from '@/contexts/TenantContext';

export function ReportFooter() {
  const { tenant, branding } = useTenant();
  const rs = branding as any;

  const company = rs?.footer_company_name || tenant?.company_name || '';
  const addressParts = [rs?.footer_address, rs?.footer_postal_code, rs?.footer_city, rs?.footer_country].filter(Boolean).join(', ');
  const contactParts = [
    rs?.footer_email,
    rs?.footer_phone && `Tel. ${rs.footer_phone}`,
    rs?.footer_website,
  ].filter(Boolean);
  const regParts = [
    rs?.kvk_number && `KvK: ${rs.kvk_number}`,
    rs?.btw_number && `BTW: ${rs.btw_number}`,
  ].filter(Boolean);

  if (!company && !addressParts && contactParts.length === 0) return null;

  return (
    <footer className="report-footer pt-4 border-t border-foreground/8">
      <div className="flex items-end justify-between text-[9px] text-muted-foreground leading-relaxed">
        <div className="space-y-0.5">
          <p className="font-semibold text-foreground text-[10px]">{company}</p>
          {addressParts && <p>{addressParts}</p>}
          {contactParts.length > 0 && <p>{contactParts.join('  ·  ')}</p>}
          {regParts.length > 0 && <p>{regParts.join('  ·  ')}</p>}
        </div>
        {branding?.logo_url && (
          <img src={branding.logo_url} alt="" className="h-4 w-auto opacity-15" />
        )}
      </div>
    </footer>
  );
}
