import { ReportElectrode } from '@/hooks/use-report-data';
import { ReportImageBlock } from './ReportImageBlock';
import { formatNlNumber } from '@/lib/nl-number';

interface ReportElectrodeSectionProps {
  electrode: ReportElectrode;
  index: number;
  totalElectrodes: number;
}

export function ReportElectrodeSection({ electrode, index, totalElectrodes }: ReportElectrodeSectionProps) {
  const activePens = electrode.pens.filter(
    pen => pen.measurements.some(m => m.resistance_value > 0)
  );
  if (activePens.length === 0) return null;

  const showElectrodeHeader = totalElectrodes > 1;
  const hasRv = electrode.rv_value != null && electrode.rv_value > 0;

  // Build unified depth list across all pens
  const depthSet = new Set<number>();
  activePens.forEach(pen =>
    pen.measurements.forEach(m => {
      if (m.resistance_value > 0) depthSet.add(m.depth_meters);
    })
  );
  const depths = Array.from(depthSet).sort((a, b) => a - b);

  // Build lookup: penId -> depth -> value
  const valueLookup = new Map<string, Map<number, number>>();
  activePens.forEach(pen => {
    const map = new Map<number, number>();
    pen.measurements.forEach(m => {
      if (m.resistance_value > 0) map.set(m.depth_meters, m.resistance_value);
    });
    valueLookup.set(pen.id, map);
  });

  // Collect all photos
  const photos: { url: string; label: string }[] = [];
  activePens.forEach(pen => {
    const suffix = activePens.length > 1 ? ` Pen ${pen.pen_code}` : '';
    if (pen.display_photo_url) photos.push({ url: pen.display_photo_url, label: `Detailfoto${suffix}` });
    if (pen.overview_photo_url) photos.push({ url: pen.overview_photo_url, label: `Overzichtsfoto${suffix}` });
  });

  return (
    <div className="report-electrode mb-10 page-break-inside-avoid">
      {showElectrodeHeader && (
        <div className="mb-4 pb-2 border-b border-foreground/15">
          <h3 className="text-sm font-bold text-foreground">
            Elektrode {electrode.electrode_code || index + 1}
            {electrode.label && (
              <span className="font-normal text-muted-foreground ml-2">— {electrode.label}</span>
            )}
          </h3>
        </div>
      )}

      {/* RA + RV */}
      <div className="flex flex-wrap gap-x-8 gap-y-2 mb-5">
        {electrode.ra_value != null && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground mb-0.5">RA-waarde</p>
            <p className="text-base font-bold text-foreground tabular-nums">{formatNlNumber(Number(electrode.ra_value))} Ω</p>
          </div>
        )}
        {hasRv && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground mb-0.5">RV-waarde</p>
            <p className="text-base font-bold text-foreground tabular-nums">{formatNlNumber(Number(electrode.rv_value))} Ω</p>
          </div>
        )}
        {electrode.target_value != null && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground mb-0.5">Doelwaarde</p>
            <p className="text-base font-medium text-foreground tabular-nums">≤ {formatNlNumber(Number(electrode.target_value))} Ω</p>
          </div>
        )}
      </div>

      {electrode.notes && (
        <p className="text-[11px] text-muted-foreground mb-4 italic leading-relaxed">{electrode.notes}</p>
      )}

      {/* Combined measurement table */}
      {depths.length > 0 && (
        <table className="w-full text-[12px] border-collapse mt-2 mb-4">
          <thead>
            <tr className="border-b-2 border-foreground/15">
              <th className="text-left py-2 pr-4 font-semibold text-foreground">Diepte (m)</th>
              {activePens.map(pen => (
                <th key={pen.id} className="text-right py-2 px-2 font-semibold text-foreground whitespace-nowrap">
                  {activePens.length > 1 ? `Pen ${pen.pen_code}` : 'Weerstand (Ω)'}
                </th>
              ))}
            </tr>
            {/* Sub-header with Ω when multiple pens */}
            {activePens.length > 1 && (
              <tr className="border-b border-foreground/8">
                <th className="py-1 pr-4" />
                {activePens.map(pen => (
                  <th key={pen.id} className="text-right py-1 px-2 text-[10px] font-normal text-muted-foreground">(Ω)</th>
                ))}
              </tr>
            )}
          </thead>
          <tbody>
            {depths.map(depth => (
              <tr key={depth} className="border-b border-foreground/8">
                <td className="py-1.5 pr-4 tabular-nums text-foreground">{formatNlNumber(depth, 1)}</td>
                {activePens.map(pen => {
                  const val = valueLookup.get(pen.id)?.get(depth);
                  return (
                    <td key={pen.id} className="py-1.5 px-2 text-right tabular-nums font-semibold text-foreground">
                      {val != null ? formatNlNumber(val) : '—'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Photos */}
      {photos.length > 0 && <ReportImageBlock images={photos} />}
    </div>
  );
}
