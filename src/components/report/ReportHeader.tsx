import { useTenant } from '@/contexts/TenantContext';
import { formatNlDate } from '@/lib/nl-date';

interface ReportHeaderProps {
  projectName: string;
  projectNumber: string;
  measurementDate?: string | null;
  location?: string;
}

export function ReportHeader({ projectName, projectNumber, measurementDate, location }: ReportHeaderProps) {
  const { tenant, branding } = useTenant();

  return (
    <div className="report-header mb-10">
      {/* Brand bar */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          {branding?.logo_url && (
            <img src={branding.logo_url} alt="" className="h-10 w-auto max-w-[160px] object-contain print:h-8" />
          )}
          <span className="text-sm font-semibold text-foreground tracking-tight">{tenant?.company_name}</span>
        </div>
        {measurementDate && (
          <span className="text-xs text-muted-foreground">{formatNlDate(measurementDate, 'long')}</span>
        )}
      </div>

      {/* Title block */}
      <div className="border-l-[3px] pl-5 py-1" style={{ borderColor: `hsl(var(--tenant-primary))` }}>
        <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-muted-foreground mb-1">Aardingsmeting Rapport</p>
        <h1 className="text-xl font-bold text-foreground leading-tight tracking-tight">{projectName}</h1>
        <p className="text-sm text-muted-foreground mt-1 font-mono">{projectNumber}</p>
        {location && <p className="text-xs text-muted-foreground mt-1">{location}</p>}
      </div>
    </div>
  );
}
