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
    <div className="report-summary mb-6 flex gap-6">
      {items.map(s => (
        <div key={s.label} className="text-center">
          <p className="text-lg font-bold text-foreground tabular-nums">{s.value}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
        </div>
      ))}
    </div>
  );
}
