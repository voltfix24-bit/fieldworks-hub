interface ReportInfoSectionProps {
  title: string;
  rows: { label: string; value: string | null | undefined }[];
}

export function ReportInfoSection({ title, rows }: ReportInfoSectionProps) {
  const filledRows = rows.filter(r => r.value);
  if (filledRows.length === 0) return null;

  return (
    <div className="report-info-section mb-6">
      <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3 pb-1 border-b border-border">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1.5">
        {filledRows.map(row => (
          <div key={row.label} className="flex justify-between py-0.5">
            <span className="text-xs text-muted-foreground">{row.label}</span>
            <span className="text-xs font-medium text-foreground text-right">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
