import { useTenant } from '@/contexts/TenantContext';
import { formatNlDate } from '@/lib/nl-date';

interface ReportHeaderProps {
  projectName?: string | null;
  projectNumber?: string | null;
  measurementDate?: string | null;
  location?: string | null;
  technicianName?: string | null;
}

export function ReportHeader({ projectName, projectNumber, measurementDate, location, technicianName }: ReportHeaderProps) {
  const { tenant, branding } = useTenant();
  const rs = branding as any;
  const showLogo = rs?.report_show_logo !== false;
  const logoSize = rs?.report_logo_size || 'medium';
  const logoHeight = logoSize === 'small' ? '8mm' : logoSize === 'large' ? '16mm' : '12mm';

  const meta = [
    projectNumber ? { lbl: 'Projectnummer', val: projectNumber, mono: true } : null,
    measurementDate ? { lbl: 'Meetdatum', val: formatNlDate(measurementDate, 'long') || '', mono: true } : null,
    technicianName ? { lbl: 'Monteur', val: technicianName, mono: false } : null,
  ].filter(Boolean) as { lbl: string; val: string; mono: boolean }[];

  const hasHeaderRow = !!(showLogo && branding?.logo_url) || !!tenant?.company_name || !!projectNumber;

  return (
    <header className="report-cover">
      <div className="report-brand-bar" />

      {hasHeaderRow && (
        <div className="flex items-start justify-between gap-6 mb-8">
          <div className="min-w-0">
            {showLogo && branding?.logo_url ? (
              <img
                src={branding.logo_url}
                alt={tenant?.company_name || ''}
                style={{ height: logoHeight }}
                className="w-auto max-w-[60mm] object-contain"
              />
            ) : tenant?.company_name ? (
              <p style={{ fontSize: '12pt', fontWeight: 700, color: 'var(--ink)' }}>
                {tenant.company_name}
              </p>
            ) : null}
          </div>
          {projectNumber && (
            <div className="text-right">
              <p style={{ fontSize: '8pt', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 600 }}>
                Document
              </p>
              <p className="tabular-nums" style={{ fontSize: '11pt', color: 'var(--ink)', fontWeight: 600, marginTop: 2 }}>
                {projectNumber}
              </p>
            </div>
          )}
        </div>
      )}

      <p className="report-cover-eyebrow">Aardingsmeting</p>
      <h1 className="report-cover-title">Aardingsrapport</h1>

      {projectName && <p className="report-cover-project">{projectName}</p>}
      {location && <p className="report-cover-location">{location}</p>}

      {meta.length > 0 && (
        <div className="report-meta-strip">
          {meta.map(m => (
            <div key={m.lbl}>
              <div className="lbl">{m.lbl}</div>
              <div className={`val ${m.mono ? 'tabular-nums' : ''}`}>{m.val}</div>
            </div>
          ))}
        </div>
      )}
    </header>
  );
}
