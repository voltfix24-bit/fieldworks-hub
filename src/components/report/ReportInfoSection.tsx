interface ReportInfoSectionProps {
  title: string;
  rows: { label: string; value: string | null | undefined }[];
}

export function ReportInfoSection({ title, rows }: ReportInfoSectionProps) {
  const filledRows = rows.filter(r => r.value);
  if (filledRows.length === 0) return null;

  return (
    <div className="report-info-section mb-8 page-break-inside-avoid">
      <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-foreground mb-3 pb-2 border-b border-foreground/15">
        {title}
      </h2>
      <dl className="grid grid-cols-[minmax(120px,auto)_1fr] gap-x-8 gap-y-1.5">
        {filledRows.map(row => (
          <div key={row.label} className="contents">
            <dt className="text-[12px] text-muted-foreground py-0.5 whitespace-nowrap">{row.label}</dt>
            <dd className="text-[12px] font-medium text-foreground py-0.5">{row.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
