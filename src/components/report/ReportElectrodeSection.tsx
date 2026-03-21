import { ReportElectrode } from '@/hooks/use-report-data';
import { ReportImageBlock } from './ReportImageBlock';
import { formatNlNumber } from '@/lib/nl-number';

interface ReportElectrodeSectionProps {
  electrode: ReportElectrode;
  index: number;
  totalElectrodes: number;
  showPhotos?: boolean;
  emptyCellChar?: string;
}

/** Strip redundant prefix: if electrode_code is "Elektrode 1", just use "1" */
function cleanCode(code: string, prefix: string): string {
  const lower = code.toLowerCase().trim();
  const p = prefix.toLowerCase();
  if (lower.startsWith(p)) return code.trim().slice(prefix.length).trim();
  return code.trim();
}

export function ReportElectrodeSection({ electrode, index, totalElectrodes, showPhotos = true, emptyCellChar = '—' }: ReportElectrodeSectionProps) {
  const activePens = electrode.pens.filter(
    pen => pen.measurements.some(m => m.resistance_value > 0)
  );
  if (activePens.length === 0) return null;

  const showElectrodeHeader = totalElectrodes > 1;

  // RA/RV logic: never show both — RV takes precedence when filled
  const hasRv = electrode.rv_value != null && electrode.rv_value > 0;
  const hasRa = !hasRv && electrode.ra_value != null && electrode.ra_value > 0;

  const electrodeDisplay = electrode.electrode_code
    ? cleanCode(electrode.electrode_code, 'Elektrode')
    : String(index + 1);

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

  // Collect electrode-level photos (from all pens, but labelled at electrode level)
  const photos: { url: string; label: string }[] = [];
  activePens.forEach(pen => {
    if (pen.display_photo_url) photos.push({ url: pen.display_photo_url, label: 'Detailfoto' });
    if (pen.overview_photo_url) photos.push({ url: pen.overview_photo_url, label: 'Overzichtsfoto' });
  });

  return (
    <div className="report-electrode mb-8">
      {/* Elektrode header */}
      {showElectrodeHeader && (
        <div className="mb-3 pb-1.5 border-b border-foreground/12">
          <h3 className="text-[13px] font-bold text-foreground tracking-tight">
            Elektrode {electrodeDisplay}
            {electrode.label && (
              <span className="font-normal text-muted-foreground ml-2 text-[12px]">— {electrode.label}</span>
            )}
          </h3>
        </div>
      )}

      {/* RA or RV (never both) */}
      <div className="flex flex-wrap gap-x-8 gap-y-1.5 mb-4">
        {hasRa && (
          <div className="flex items-baseline gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">RA:</span>
            <span className="text-[13px] font-bold text-foreground tabular-nums">{formatNlNumber(Number(electrode.ra_value))} Ω</span>
          </div>
        )}
        {hasRv && (
          <div className="flex items-baseline gap-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">RV:</span>
            <span className="text-[13px] font-bold text-foreground tabular-nums">{formatNlNumber(Number(electrode.rv_value))} Ω</span>
          </div>
        )}
      </div>

      {electrode.notes && (
        <p className="text-[11px] text-muted-foreground mb-3 italic leading-relaxed">{electrode.notes}</p>
      )}

      {/* Combined measurement table */}
      {depths.length > 0 && (
        <table className="w-full text-[11px] border-collapse mb-3">
          <thead>
            <tr className="border-b-2 border-foreground/15">
              <th className="text-left py-1.5 pr-3 font-semibold text-foreground">Diepte (m)</th>
              {activePens.map(pen => {
                const penDisplay = cleanCode(pen.pen_code, 'Pen');
                return (
                  <th key={pen.id} className="text-right py-1.5 px-2 font-semibold text-foreground whitespace-nowrap">
                    {activePens.length > 1 ? `Pen ${penDisplay} (Ω)` : 'Weerstand (Ω)'}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {depths.map(depth => (
              <tr key={depth} className="border-b border-foreground/6">
                <td className="py-1 pr-3 tabular-nums text-foreground">{formatNlNumber(depth, 1)}</td>
                {activePens.map(pen => {
                  const val = valueLookup.get(pen.id)?.get(depth);
                  return (
                    <td key={pen.id} className="py-1 px-2 text-right tabular-nums font-semibold text-foreground">
                      {val != null ? formatNlNumber(val) : '—'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Electrode-level photos */}
      {photos.length > 0 && <ReportImageBlock images={photos} />}
    </div>
  );
}
