interface ReportInfoSectionProps {
  title: string;
  rows: { label: string; value: string | null | undefined }[];
}

export function ReportInfoSection({ title, rows }: ReportInfoSectionProps) {
  const filledRows = rows.filter(r => r.value);
  if (filledRows.length === 0) return null;

  return (
    <div className="report-info-section mb-6">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground mb-2.5 pb-1.5 border-b border-border">{title}</h2>
      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1">
        {filledRows.map(row => (
          <div key={row.label} className="contents">
            <dt className="text-xs text-muted-foreground py-0.5 whitespace-nowrap">{row.label}</dt>
            <dd className="text-xs font-medium text-foreground py-0.5">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
