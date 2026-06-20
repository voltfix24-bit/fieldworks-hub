interface ReportInfoSectionProps {
  title: string;
  rows: { label: string; value: string | null | undefined }[];
}

export function ReportInfoSection({ title, rows }: ReportInfoSectionProps) {
  const filledRows = rows.filter(r => r.value);
  if (filledRows.length === 0) return null;

  return (
    <section className="report-info-section mb-6 page-break-inside-avoid rounded-2xl border border-slate-200 bg-slate-50/70 p-5 print:bg-slate-50 print:p-4">
      <h2 className="mb-4 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-[hsl(var(--tenant-primary))]">
        <span className="h-0.5 w-5 rounded-full bg-[hsl(var(--tenant-primary))]" />
        {title}
      </h2>
      <dl className="divide-y divide-slate-200/80">
        {filledRows.map(row => (
          <div key={row.label} className="grid grid-cols-[minmax(96px,0.72fr)_1fr] gap-4 py-2.5 first:pt-0 last:pb-0">
            <dt className="text-[9px] font-bold uppercase tracking-[0.09em] text-slate-400 leading-relaxed">{row.label}</dt>
            <dd className="text-[11.5px] font-semibold text-slate-900 leading-snug text-right sm:text-left print:text-left">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
