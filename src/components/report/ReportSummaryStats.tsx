interface ReportSummaryStatsProps {
  stats: {
    electrodeCount: number;
    penCount: number;
    measurementCount: number;
    photosCount: number;
  };
  hasSketch: boolean;
}

export function ReportSummaryStats({ stats, hasSketch }: ReportSummaryStatsProps) {
  return (
    <div className="report-summary mb-6">
      <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3 pb-1 border-b border-border">Measurement Summary</h2>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Electrodes', value: stats.electrodeCount },
          { label: 'Pens', value: stats.penCount },
          { label: 'Measurements', value: stats.measurementCount },
          { label: 'Photos', value: stats.photosCount },
          { label: 'Sketch', value: hasSketch ? 'Yes' : 'No' },
        ].map(s => (
          <div key={s.label} className="text-center py-2 px-3 rounded bg-muted/50 border border-border">
            <p className="text-lg font-bold text-foreground">{s.value}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
