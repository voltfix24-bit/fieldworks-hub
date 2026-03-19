import { useTenant } from '@/contexts/TenantContext';

interface ReportHeaderProps {
  projectName: string;
  projectNumber: string;
  status: string;
  measurementDate?: string | null;
  location?: string;
}

export function ReportHeader({ projectName, projectNumber, status, measurementDate, location }: ReportHeaderProps) {
  const { tenant, branding } = useTenant();

  return (
    <div className="report-header mb-8">
      {/* Brand bar */}
      <div className="flex items-center justify-between pb-4 mb-6 border-b-2" style={{ borderColor: `hsl(var(--tenant-primary))` }}>
        <div className="flex items-center gap-4">
          {branding?.logo_url && (
            <img src={branding.logo_url} alt={tenant?.company_name || ''} className="h-12 w-auto max-w-[180px] object-contain" />
          )}
          <div>
            <p className="text-lg font-bold tenant-primary-text">{tenant?.company_name}</p>
            <p className="text-xs text-muted-foreground">Field Measurement Report</p>
          </div>
        </div>
        <div className="text-right">
          <span className={`text-xs px-2 py-0.5 rounded font-medium ${status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
            {status === 'completed' ? 'Completed' : 'Planned'}
          </span>
        </div>
      </div>

      {/* Title block */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">{projectName}</h1>
        <p className="text-sm font-mono text-muted-foreground mt-1">{projectNumber}</p>
        {location && <p className="text-sm text-muted-foreground mt-1">{location}</p>}
        {measurementDate && <p className="text-xs text-muted-foreground mt-2">Measurement date: {measurementDate}</p>}
      </div>
    </div>
  );
}
