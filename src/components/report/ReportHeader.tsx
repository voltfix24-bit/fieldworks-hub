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
    <div className="report-header mb-8 print:mb-6">
      {/* Top identity bar */}
      <div className="flex items-start justify-between pb-4 border-b-2" style={{ borderColor: 'hsl(var(--tenant-primary))' }}>
        <div className="flex items-center gap-3">
          {branding?.logo_url && (
            <img src={branding.logo_url} alt="" className="h-10 w-auto max-w-[140px] object-contain print:h-8" />
          )}
          <span className="text-[12px] font-semibold text-foreground tracking-tight">{tenant?.company_name}</span>
        </div>
      </div>

      {/* Report title */}
      <div className="mt-6 print:mt-4">
        <p className="text-[9px] font-bold uppercase tracking-[0.2em] mb-1.5" style={{ color: 'hsl(var(--tenant-primary))' }}>
          Aardingsmeting Rapport
        </p>
        <h1 className="text-xl font-bold text-foreground leading-tight tracking-tight print:text-lg">
          {projectName}
        </h1>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 mt-1.5 text-[11px]">
          <span className="text-foreground font-mono font-medium">{projectNumber}</span>
          {location && (
            <>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground">{location}</span>
            </>
          )}
          {measurementDate && (
            <>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground">{formatNlDate(measurementDate, 'long')}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
