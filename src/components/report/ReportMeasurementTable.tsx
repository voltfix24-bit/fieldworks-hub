import { formatNlNumber } from '@/lib/nl-number';

interface ReportMeasurementTableProps {
  measurements: { depth_meters: number; resistance_value: number }[];
}

export function ReportMeasurementTable({ measurements }: ReportMeasurementTableProps) {
  const filledRows = measurements.filter(m => m.resistance_value > 0);
  if (filledRows.length === 0) return null;

  return (
    <table className="w-full text-[12px] border-collapse mt-2 mb-3">
      <thead>
        <tr className="border-b-2 border-foreground/15">
          <th className="text-left py-2 pr-4 font-semibold text-foreground w-1/2">Diepte (m)</th>
          <th className="text-right py-2 pl-4 font-semibold text-foreground w-1/2">Weerstand (Ω)</th>
        </tr>
      </thead>
      <tbody>
        {filledRows.map((m, i) => (
          <tr key={i} className="border-b border-foreground/8">
            <td className="py-1.5 pr-4 tabular-nums text-foreground">{formatNlNumber(Number(m.depth_meters), 1)}</td>
            <td className="py-1.5 pl-4 text-right tabular-nums font-semibold text-foreground">{formatNlNumber(Number(m.resistance_value))}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
