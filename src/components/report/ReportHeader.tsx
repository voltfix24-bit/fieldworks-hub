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
  const rs = branding as any;
  const reportTitle = rs?.report_title || 'Aardingsmeting Rapport';
  const showLogo = rs?.report_show_logo !== false;
  const logoSize = rs?.report_logo_size || 'medium';

  const logoClass = logoSize === 'small' ? 'h-7' : logoSize === 'large' ? 'h-14' : 'h-10';

  return (
    <div className="report-header mb-8 print:mb-6">
      <div className="flex items-start justify-between pb-4 border-b-2" style={{ borderColor: 'hsl(var(--tenant-primary))' }}>
        <div className="flex items-center gap-3">
          {showLogo && branding?.logo_url && (
            <img src={branding.logo_url} alt="" className={`${logoClass} w-auto max-w-[160px] object-contain print:max-h-10`} />
          )}
          <span className="text-[12px] font-semibold text-foreground tracking-tight">{tenant?.company_name}</span>
        </div>
      </div>

      <div className="mt-6 print:mt-4">
        <p className="text-[9px] font-bold uppercase tracking-[0.2em] mb-1.5" style={{ color: 'hsl(var(--tenant-primary))' }}>
          {reportTitle}
        </p>
        {rs?.report_subtitle && (
          <p className="text-[10px] text-muted-foreground mb-1">{rs.report_subtitle}</p>
        )}
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
