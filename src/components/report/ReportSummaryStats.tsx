interface ReportSummaryStatsProps {
  stats: { electrodeCount: number; penCount: number; measurementCount: number };
}

export function ReportSummaryStats({ stats }: ReportSummaryStatsProps) {
  const items = [
    { label: 'Elektrodes', value: stats.electrodeCount },
    { label: 'Pennen', value: stats.penCount },
    { label: 'Metingen', value: stats.measurementCount },
  ].filter(i => i.value > 0);

  if (items.length === 0) return null;

  return (
    <div className="report-summary mb-8 page-break-inside-avoid">
      <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-foreground mb-3 pb-2 border-b border-foreground/15">
        Samenvatting
      </h2>
      <div className="flex gap-8">
        {items.map(s => (
          <div key={s.label}>
            <p className="text-[12px] text-muted-foreground">{s.label}</p>
            <p className="text-base font-bold text-foreground tabular-nums">{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
