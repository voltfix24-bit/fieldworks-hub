import { ReportElectrode } from '@/hooks/use-report-data';
import { ReportMeasurementTable } from './ReportMeasurementTable';
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

  return (
    <div className="report-electrode mb-10 page-break-inside-avoid">
      {/* Elektrode header */}
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

      {/* RA + RV summary */}
      <div className="flex flex-wrap gap-x-8 gap-y-2 mb-5">
        {electrode.ra_value != null && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground mb-0.5">RA-waarde</p>
            <p className="text-base font-bold text-foreground tabular-nums">
              {formatNlNumber(Number(electrode.ra_value))} Ω
            </p>
          </div>
        )}
        {hasRv && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground mb-0.5">RV-waarde</p>
            <p className="text-base font-bold text-foreground tabular-nums">
              {formatNlNumber(Number(electrode.rv_value))} Ω
            </p>
          </div>
        )}
        {electrode.target_value != null && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground mb-0.5">Doelwaarde</p>
            <p className="text-base font-medium text-foreground tabular-nums">
              ≤ {formatNlNumber(Number(electrode.target_value))} Ω
            </p>
          </div>
        )}
      </div>

      {electrode.notes && (
        <p className="text-[11px] text-muted-foreground mb-4 italic leading-relaxed">{electrode.notes}</p>
      )}

      {/* Pens */}
      {activePens.map((pen) => {
        const hasPhotos = !!pen.display_photo_url || !!pen.overview_photo_url;
        const showPenHeader = activePens.length > 1;

        return (
          <div key={pen.id} className="mb-6 page-break-inside-avoid">
            {showPenHeader && (
              <div className="mb-2">
                <p className="text-[12px] font-bold text-foreground">
                  Pen {pen.pen_code}
                  {pen.label && (
                    <span className="font-normal text-muted-foreground ml-1.5">— {pen.label}</span>
                  )}
                </p>
                {pen.pen_depth_meters != null && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Pendiepte: {formatNlNumber(Number(pen.pen_depth_meters), 1)} m
                  </p>
                )}
              </div>
            )}

            {pen.notes && (
              <p className="text-[10px] text-muted-foreground mb-1.5 italic">{pen.notes}</p>
            )}

            <ReportMeasurementTable measurements={pen.measurements} />

            {hasPhotos && (
              <ReportImageBlock images={[
                ...(pen.display_photo_url ? [{ url: pen.display_photo_url, label: `Detailfoto${showPenHeader ? ` Pen ${pen.pen_code}` : ''}` }] : []),
                ...(pen.overview_photo_url ? [{ url: pen.overview_photo_url, label: `Overzichtsfoto${showPenHeader ? ` Pen ${pen.pen_code}` : ''}` }] : []),
              ]} />
            )}
          </div>
        );
      })}
    </div>
  );
}
