import type { ReportElectrode } from '@/hooks/use-report-data';
import { formatNlNumber } from '@/lib/nl-number';

const DEFAULT_TARGET_VALUE = 2;

interface ReportSummaryStatsProps {
  stats: { electrodeCount: number; penCount: number; measurementCount: number; photosCount?: number };
  electrodes?: ReportElectrode[];
  hasSketches?: boolean;
  calibrationLabel?: string | null;
  calibrationExpired?: boolean;
}

export function ReportSummaryStats({
  stats,
  electrodes = [],
  hasSketches = false,
  calibrationLabel,
  calibrationExpired = false,
}: ReportSummaryStatsProps) {
  const statItems = [
    { label: 'Elektrodes', value: stats.electrodeCount },
    { label: 'Pennen', value: stats.penCount },
    { label: 'Metingen', value: stats.measurementCount },
    { label: "Foto's", value: stats.photosCount || 0 },
  ].filter(i => i.value > 0);

  const electrodeRows = electrodes.map((electrode, index) => {
    const hasRv = electrode.rv_value != null && electrode.rv_value > 0;
    const resultType = hasRv ? 'RV' : 'RA';
    const resultValue = hasRv ? Number(electrode.rv_value) : electrode.ra_value != null ? Number(electrode.ra_value) : null;
    const targetValue = electrode.target_value != null ? Number(electrode.target_value) : DEFAULT_TARGET_VALUE;
    const ok = resultValue != null
      ? resultValue <= targetValue
      : electrode.target_met === true;

    return {
      id: electrode.id,
      label: electrode.electrode_code || `Elektrode ${index + 1}`,
      resultType,
      resultValue,
      targetValue,
      ok,
    };
  });

  const allOk = electrodeRows.length > 0 && electrodeRows.every(row => row.ok);

  if (statItems.length === 0 && electrodeRows.length === 0) return null;

  return (
    <section className="report-summary mb-9 page-break-inside-avoid rounded-[18px] border border-slate-200 bg-white p-5 shadow-sm print:shadow-none print:p-4">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[hsl(var(--tenant-primary))]">Samenvatting</p>
          <h2 className="mt-1 text-[19px] font-extrabold tracking-tight text-slate-950">Conclusie & overzicht</h2>
        </div>
        <div className={allOk ? 'rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-right' : 'rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-right'}>
          <p className={allOk ? 'text-[10px] font-extrabold uppercase tracking-[0.11em] text-emerald-700' : 'text-[10px] font-extrabold uppercase tracking-[0.11em] text-amber-700'}>
            {allOk ? 'Goedgekeurd' : 'Aandacht vereist'}
          </p>
          <p className="mt-0.5 text-[11px] font-semibold text-slate-600">
            {allOk ? 'Alle resultaten binnen toetswaarde' : 'Controleer meetresultaten of waarschuwingen'}
          </p>
        </div>
      </div>

      {statItems.length > 0 && (
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4 print:grid-cols-4">
          {statItems.map(s => (
            <div key={s.label} className="rounded-2xl bg-slate-50 px-4 py-3 text-center">
              <p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-slate-400">{s.label}</p>
              <p className="mt-1 text-[22px] font-extrabold tabular-nums text-slate-950">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {electrodeRows.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <table className="w-full border-collapse text-[11px]">
            <thead>
              <tr className="bg-[hsl(var(--tenant-primary))] text-white">
                <th className="px-3 py-2.5 text-left text-[9px] font-extrabold uppercase tracking-[0.1em]">Elektrode</th>
                <th className="px-3 py-2.5 text-center text-[9px] font-extrabold uppercase tracking-[0.1em]">Type</th>
                <th className="px-3 py-2.5 text-right text-[9px] font-extrabold uppercase tracking-[0.1em]">Waarde</th>
                <th className="px-3 py-2.5 text-right text-[9px] font-extrabold uppercase tracking-[0.1em]">Toets</th>
                <th className="px-3 py-2.5 text-right text-[9px] font-extrabold uppercase tracking-[0.1em]">Resultaat</th>
              </tr>
            </thead>
            <tbody>
              {electrodeRows.map((row, index) => (
                <tr key={row.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="border-t border-slate-200 px-3 py-2 font-bold text-slate-900">{row.label}</td>
                  <td className="border-t border-slate-200 px-3 py-2 text-center font-semibold text-slate-500">{row.resultType}</td>
                  <td className={row.ok ? 'border-t border-slate-200 px-3 py-2 text-right font-extrabold tabular-nums text-emerald-700' : 'border-t border-slate-200 px-3 py-2 text-right font-extrabold tabular-nums text-red-700'}>
                    {row.resultValue != null ? `${formatNlNumber(row.resultValue)} Ω` : '—'}
                  </td>
                  <td className="border-t border-slate-200 px-3 py-2 text-right font-semibold tabular-nums text-slate-600">
                    ≤ {formatNlNumber(row.targetValue)} Ω
                  </td>
                  <td className={row.ok ? 'border-t border-slate-200 px-3 py-2 text-right font-extrabold text-emerald-700' : 'border-t border-slate-200 px-3 py-2 text-right font-extrabold text-red-700'}>
                    {row.ok ? 'Voldoet' : 'Voldoet niet'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2 print:grid-cols-2">
        <StatusLine label="Kalibratie" value={calibrationLabel || 'Niet ingevuld'} tone={calibrationExpired ? 'danger' : 'ok'} />
        <StatusLine label="Situatieschets" value={hasSketches ? 'Bijgevoegd' : 'Niet bijgevoegd'} tone={hasSketches ? 'ok' : 'warn'} />
      </div>
    </section>
  );
}

function StatusLine({ label, value, tone }: { label: string; value: string; tone: 'ok' | 'warn' | 'danger' }) {
  const toneClass = tone === 'ok'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
    : tone === 'danger'
      ? 'border-red-200 bg-red-50 text-red-800'
      : 'border-amber-200 bg-amber-50 text-amber-800';

  return (
    <div className={`rounded-2xl border px-4 py-3 ${toneClass}`}>
      <p className="text-[9px] font-extrabold uppercase tracking-[0.12em] opacity-70">{label}</p>
      <p className="mt-1 text-[12px] font-bold">{value}</p>
    </div>
  );
}
