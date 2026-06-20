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

export function ReportElectrodeSection({ electrode, index, showPhotos = true, emptyCellChar = '—' }: ReportElectrodeSectionProps) {
  const activePens = electrode.pens.filter(
    pen => pen.measurements.some(m => m.resistance_value > 0)
  );
  if (activePens.length === 0) return null;

  // RA/RV logic: never show both — RV takes precedence when filled
  const hasRv = electrode.rv_value != null && electrode.rv_value > 0;
  const resultType = hasRv ? 'RV' : 'RA';
  const resultValue = hasRv ? Number(electrode.rv_value) : electrode.ra_value != null ? Number(electrode.ra_value) : null;
  const targetValue = electrode.target_value != null ? Number(electrode.target_value) : null;
  const isOk = resultValue != null && targetValue != null
    ? resultValue <= targetValue
    : electrode.target_met === true;
  const hasResult = resultValue != null && resultValue > 0;

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
    if (pen.display_photo_url) photos.push({ url: pen.display_photo_url, label: 'Meetdisplay' });
    if (pen.overview_photo_url) photos.push({ url: pen.overview_photo_url, label: 'Overzichtsfoto' });
  });

  return (
    <section className="report-electrode mb-10 page-break-inside-avoid rounded-[18px] border border-slate-200 bg-white p-5 shadow-sm print:shadow-none print:p-4">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--tenant-primary))] text-[14px] font-extrabold text-white">
            {index + 1}
          </div>
          <div className="min-w-0">
            <h3 className="text-[16px] font-extrabold tracking-tight text-slate-950 leading-tight">
              Elektrode {electrodeDisplay}
            </h3>
            {electrode.label && (
              <p className="mt-0.5 text-[11px] text-slate-500 truncate">{electrode.label}</p>
            )}
          </div>
        </div>
        <div className={isOk ? 'rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-emerald-700' : 'rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-red-700'}>
          <span className="text-[10px] font-extrabold uppercase tracking-[0.08em]">
            {isOk ? 'Voldoet' : 'Voldoet niet'}
          </span>
        </div>
      </div>

      <div className="mb-5 grid overflow-hidden rounded-2xl border border-slate-200 sm:grid-cols-2 print:grid-cols-2">
        <div className={isOk ? 'bg-emerald-50 px-5 py-4' : 'bg-red-50 px-5 py-4'}>
          <p className="text-[9px] font-extrabold uppercase tracking-[0.13em] text-slate-400">
            {resultType === 'RV' ? 'Aardverspreidingsweerstand (RV)' : 'Aardingsweerstand (RA)'}
          </p>
          <p className={isOk ? 'mt-2 text-[32px] font-extrabold leading-none tracking-tight text-emerald-700 tabular-nums' : 'mt-2 text-[32px] font-extrabold leading-none tracking-tight text-red-700 tabular-nums'}>
            {hasResult ? formatNlNumber(resultValue) : emptyCellChar}
            <span className="ml-1 text-[16px] font-bold">Ω</span>
          </p>
        </div>
        <div className="flex flex-col justify-center bg-slate-50 px-5 py-4">
          <p className="text-[9px] font-extrabold uppercase tracking-[0.13em] text-slate-400">Toetswaarde</p>
          <p className="mt-2 text-[22px] font-extrabold text-slate-900 tabular-nums">
            {targetValue != null ? `≤ ${formatNlNumber(targetValue)} Ω` : emptyCellChar}
          </p>
          <p className={isOk ? 'mt-1 text-[11px] font-semibold text-emerald-700' : 'mt-1 text-[11px] font-semibold text-red-700'}>
            {isOk ? 'Binnen grenswaarde' : 'Buiten grenswaarde of niet compleet'}
          </p>
        </div>
      </div>

      {electrode.notes && (
        <p className="mb-4 rounded-xl border-l-4 border-[hsl(var(--tenant-primary)/0.45)] bg-[hsl(var(--tenant-primary)/0.06)] px-4 py-3 text-[11px] italic leading-relaxed text-slate-600">
          {electrode.notes}
        </p>
      )}

      {depths.length > 0 && (
        <div className="mb-4">
          <h4 className="mb-2 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.13em] text-slate-700">
            <span className="h-0.5 w-4 rounded-full bg-[hsl(var(--tenant-primary))]" />
            Meetwaarden per diepte
          </h4>
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full border-collapse text-[11px]">
              <thead>
                <tr className="bg-[hsl(var(--tenant-primary))] text-white">
                  <th className="px-3 py-2.5 text-left text-[9px] font-extrabold uppercase tracking-[0.1em]">Diepte (m)</th>
                  {activePens.map(pen => {
                    const penDisplay = cleanCode(pen.pen_code, 'Pen');
                    return (
                      <th key={pen.id} className="px-3 py-2.5 text-right text-[9px] font-extrabold uppercase tracking-[0.1em] whitespace-nowrap">
                        {activePens.length > 1 ? `Pen ${penDisplay} (Ω)` : 'Weerstand (Ω)'}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {depths.map((depth, rowIndex) => (
                  <tr key={depth} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="border-t border-slate-200 px-3 py-2 font-semibold tabular-nums text-slate-700">{formatNlNumber(depth, 1)}</td>
                    {activePens.map(pen => {
                      const val = valueLookup.get(pen.id)?.get(depth);
                      const valueOk = targetValue != null && val != null && val <= targetValue;
                      return (
                        <td key={pen.id} className={valueOk ? 'border-t border-slate-200 px-3 py-2 text-right font-extrabold tabular-nums text-emerald-700 bg-emerald-50/60' : 'border-t border-slate-200 px-3 py-2 text-right font-semibold tabular-nums text-slate-800'}>
                          {val != null ? formatNlNumber(val) : emptyCellChar}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-[9.5px] leading-relaxed text-slate-400">
            Meetmethode: 3-punts aardingsweerstandsmeting. Maatgevende waarde: {resultType}. Toetswaarde: {targetValue != null ? `≤ ${formatNlNumber(targetValue)} Ω` : emptyCellChar}.
          </p>
        </div>
      )}

      {showPhotos && photos.length > 0 && <ReportImageBlock images={photos} />}
    </section>
  );
}
