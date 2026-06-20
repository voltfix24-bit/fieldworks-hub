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
    <footer className="report-footer mt-10 border-t border-slate-200 pt-5">
      <div className="flex items-end justify-between gap-6 text-[9px] leading-relaxed text-slate-400">
        <div className="min-w-0 space-y-0.5">
          <p className="text-[10px] font-extrabold text-slate-700">{company}</p>
          {addressParts && <p>{addressParts}</p>}
          {contactParts.length > 0 && <p>{contactParts.join('  ·  ')}</p>}
          {regParts.length > 0 && <p>{regParts.join('  ·  ')}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="rounded-md bg-[hsl(var(--tenant-primary)/0.08)] px-2.5 py-1 text-[9px] font-bold text-slate-500">Definitief</span>
          {branding?.logo_url && (
            <img src={branding.logo_url} alt="" className="h-5 w-auto opacity-20" />
          )}
        </div>
      </div>
    </footer>
  );
}
