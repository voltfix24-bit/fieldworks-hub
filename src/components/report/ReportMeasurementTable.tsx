import { formatNlNumber } from '@/lib/nl-number';

interface ReportMeasurementTableProps {
  measurements: { depth_meters: number; resistance_value: number }[];
}

export function ReportMeasurementTable({ measurements }: ReportMeasurementTableProps) {
  // Only show rows that have actual non-zero resistance values
  const filledRows = measurements.filter(m => m.resistance_value > 0);
  if (filledRows.length === 0) return null;

  return (
    <table className="w-full text-xs border-collapse mt-2">
      <thead>
        <tr className="border-b border-border">
          <th className="text-left py-1.5 px-2 font-semibold text-muted-foreground w-1/2">Diepte (m)</th>
          <th className="text-right py-1.5 px-2 font-semibold text-muted-foreground w-1/2">Weerstand (Ω)</th>
        </tr>
      </thead>
      <tbody>
        {filledRows.map((m, i) => (
          <tr key={i} className="border-b border-border/40">
            <td className="py-1 px-2 tabular-nums">{formatNlNumber(Number(m.depth_meters), 1)}</td>
            <td className="py-1 px-2 text-right tabular-nums font-medium">{formatNlNumber(Number(m.resistance_value))}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
