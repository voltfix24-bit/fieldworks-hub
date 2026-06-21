interface ReportInfoSectionProps {
  title: string;
  rows: { label: string; value: string | null | undefined; mono?: boolean }[];
}

export function ReportInfoSection({ title, rows }: ReportInfoSectionProps) {
  const filledRows = rows.filter(r => r.value);
  if (filledRows.length === 0) return null;

  return (
    <section className="report-panel report-info-section mb-4">
      <h2 className="report-panel-title">{title}</h2>
      <dl>
        {filledRows.map(row => (
          <div key={row.label} className="row">
            <dt>{row.label}</dt>
            <dd className={row.mono ? 'tabular-nums' : ''}>{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
