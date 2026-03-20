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
    <div className="report-header mb-12 print:mb-10">
      {/* Top identity bar */}
      <div className="flex items-start justify-between pb-6 border-b-2" style={{ borderColor: 'hsl(var(--tenant-primary))' }}>
        <div className="flex items-center gap-4">
          {branding?.logo_url && (
            <img
              src={branding.logo_url}
              alt=""
              className="h-12 w-auto max-w-[180px] object-contain print:h-10"
            />
          )}
          <div>
            <p className="text-sm font-semibold text-foreground tracking-tight leading-tight">
              {tenant?.company_name}
            </p>
          </div>
        </div>
      </div>

      {/* Report title block */}
      <div className="mt-8 print:mt-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] mb-2" style={{ color: 'hsl(var(--tenant-primary))' }}>
          Aardingsmeting Rapport
        </p>
        <h1 className="text-2xl font-bold text-foreground leading-tight tracking-tight print:text-xl">
          {projectName}
        </h1>
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 mt-2">
          <span className="text-sm text-foreground font-mono font-medium">{projectNumber}</span>
          {location && (
            <>
              <span className="text-muted-foreground">·</span>
              <span className="text-sm text-muted-foreground">{location}</span>
            </>
          )}
          {measurementDate && (
            <>
              <span className="text-muted-foreground">·</span>
              <span className="text-sm text-muted-foreground">{formatNlDate(measurementDate, 'long')}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
