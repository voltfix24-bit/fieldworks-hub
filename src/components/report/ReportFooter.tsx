import { useTenant } from '@/contexts/TenantContext';

function safe(url: string | undefined | null): string | null {
  if (!url) return null;
  const s = String(url).trim();
  if (!s) return null;
  if (/lovable\.app/i.test(s)) return null;
  return s;
}

export function ReportFooter() {
  const { tenant, branding } = useTenant();
  const rs = branding as any;

  const company = rs?.footer_company_name || tenant?.company_name || '';
  const addressParts = [rs?.footer_address, rs?.footer_postal_code, rs?.footer_city, rs?.footer_country].filter(Boolean).join(', ');
  const website = safe(rs?.footer_website);
  const contactParts = [
    rs?.footer_email,
    rs?.footer_phone && `Tel. ${rs.footer_phone}`,
    website,
  ].filter(Boolean);
  const regParts = [
    rs?.kvk_number && `KvK: ${rs.kvk_number}`,
    rs?.btw_number && `BTW: ${rs.btw_number}`,
  ].filter(Boolean);

  if (!company && !addressParts && contactParts.length === 0 && regParts.length === 0) return null;

  return (
    <footer className="report-doc-footer">
      <div>
        {company && <div style={{ color: 'var(--ink)', fontWeight: 600 }}>{company}</div>}
        {addressParts && <div>{addressParts}</div>}
        {contactParts.length > 0 && <div>{contactParts.join('  ·  ')}</div>}
        {regParts.length > 0 && <div className="tabular-nums">{regParts.join('  ·  ')}</div>}
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 700 }}>Aardingsrapport</div>
      </div>
    </footer>
  );
}
