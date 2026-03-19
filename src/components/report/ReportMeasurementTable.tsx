interface ReportMeasurementTableProps {
  measurements: { depth_meters: number; resistance_value: number }[];
  lowestResistance?: number | null;
}

export function ReportMeasurementTable({ measurements, lowestResistance }: ReportMeasurementTableProps) {
  if (measurements.length === 0) return null;

  return (
    <table className="w-full text-xs border-collapse">
      <thead>
        <tr className="border-b border-border">
          <th className="text-left py-1.5 px-2 font-semibold text-muted-foreground">#</th>
          <th className="text-left py-1.5 px-2 font-semibold text-muted-foreground">Diepte (m)</th>
          <th className="text-left py-1.5 px-2 font-semibold text-muted-foreground">Weerstand (Ω)</th>
        </tr>
      </thead>
      <tbody>
        {measurements.map((m, i) => {
          const isLowest = lowestResistance != null && m.resistance_value === lowestResistance;
          return (
            <tr key={i} className={`border-b border-border/50 ${isLowest ? 'bg-accent/5' : ''}`}>
              <td className="py-1 px-2 text-muted-foreground">{i + 1}</td>
              <td className={`py-1 px-2 ${isLowest ? 'font-semibold tenant-accent-text' : ''}`}>{Number(m.depth_meters).toFixed(1)}</td>
              <td className={`py-1 px-2 ${isLowest ? 'font-semibold tenant-accent-text' : ''}`}>{Number(m.resistance_value).toFixed(2)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
