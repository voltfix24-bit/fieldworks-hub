interface ReportInfoSectionProps {
  title: string;
  rows: { label: string; value: string | null | undefined }[];
}

export function ReportInfoSection({ title, rows }: ReportInfoSectionProps) {
  const filledRows = rows.filter(r => r.value);
  if (filledRows.length === 0) return null;

  return (
    <div className="report-info-section mb-6 page-break-inside-avoid">
      <h2 className="text-[10px] font-bold uppercase tracking-[0.15em] text-foreground mb-2 pb-1.5 border-b border-foreground/12">
        {title}
      </h2>
      <dl className="grid grid-cols-[minmax(100px,auto)_1fr] gap-x-6 gap-y-1">
        {filledRows.map(row => (
          <div key={row.label} className="contents">
            <dt className="text-[11px] text-muted-foreground py-0.5 whitespace-nowrap">{row.label}</dt>
            <dd className="text-[11px] font-medium text-foreground py-0.5">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
