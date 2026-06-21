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
  const logoClass = logoSize === 'small' ? 'h-8' : logoSize === 'large' ? 'h-16' : 'h-12';

  return (
    <section className="report-cover relative mb-10 overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-sm print:rounded-none print:border-0 print:shadow-none print:mb-8">
      <div className="report-brand-bar" />

      <div className="px-7 py-7 sm:px-9 sm:py-8 print:px-0 print:pt-7 print:pb-6">
        <div className="flex items-start justify-between gap-5 mb-10 print:mb-8">
          <div className="min-w-0">
            {showLogo && branding?.logo_url ? (
              <img src={branding.logo_url} alt="" className={`${logoClass} w-auto max-w-[220px] object-contain print:max-h-12`} />
            ) : tenant?.company_name ? (
              <p className="text-[14px] font-bold text-slate-900 tracking-tight">{tenant.company_name}</p>
            ) : null}
          </div>
          {projectNumber && (
            <div className="text-right min-w-[120px]">
              <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-slate-400">Document</p>
              <p className="mt-1 text-[12px] font-semibold text-slate-700 tabular-nums">{projectNumber}</p>
            </div>
          )}
        </div>

        <div className="max-w-[620px]">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.28em] text-[hsl(var(--tenant-primary))] mb-3">
            Technisch Rapport
          </p>
          <h1 className="text-[34px] sm:text-[42px] print:text-[34px] font-extrabold leading-[1.04] tracking-tight text-slate-950">
            Aardingsrapport
          </h1>
          {rs?.report_subtitle && (
            <p className="mt-3 text-[12px] text-slate-500 leading-relaxed">{rs.report_subtitle}</p>
          )}
          <div className="mt-6 h-1 w-16 rounded-full bg-[hsl(var(--tenant-primary))]" />
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-[1.4fr_1fr] print:grid-cols-[1.4fr_1fr]">
          {projectName && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400 mb-2">Project</p>
              <p className="text-[22px] print:text-[19px] font-extrabold leading-tight text-[hsl(var(--tenant-primary))]">{projectName}</p>
              {location && <p className="mt-1.5 text-[12px] text-slate-500 leading-relaxed">{location}</p>}
            </div>
          )}
          {measurementDate && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 print:bg-slate-50">
              <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">Meetdatum</p>
              <p className="mt-1 text-[15px] font-bold text-slate-900">
                {formatNlDate(measurementDate, 'long')}
              </p>
              {tenant?.company_name && <p className="mt-2 text-[11px] text-slate-500">{tenant.company_name}</p>}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
