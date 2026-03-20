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
  // Only show pens that have at least one filled measurement
  const activePens = electrode.pens.filter(
    pen => pen.measurements.some(m => m.resistance_value > 0)
  );
  if (activePens.length === 0) return null;

  const showElectrodeHeader = totalElectrodes > 1;
  const hasRv = electrode.rv_value != null && electrode.rv_value > 0;

  return (
    <div className="report-electrode mb-8 page-break-inside-avoid">
      {showElectrodeHeader && (
        <div className="flex items-baseline gap-3 mb-3 pb-2 border-b border-border">
          <h3 className="text-sm font-bold text-foreground">
            Elektrode {electrode.electrode_code || index + 1}
          </h3>
          {electrode.label && <span className="text-xs text-muted-foreground">{electrode.label}</span>}
        </div>
      )}

      {/* RA + RV summary row */}
      <div className="flex flex-wrap gap-x-6 gap-y-1 mb-4">
        {electrode.ra_value != null && (
          <div className="flex items-baseline gap-1.5">
            <span className="text-xs text-muted-foreground">RA-waarde:</span>
            <span className="text-sm font-bold text-foreground tabular-nums">{formatNlNumber(Number(electrode.ra_value))} Ω</span>
          </div>
        )}
        {hasRv && (
          <div className="flex items-baseline gap-1.5">
            <span className="text-xs text-muted-foreground">RV-waarde:</span>
            <span className="text-sm font-bold text-foreground tabular-nums">{formatNlNumber(Number(electrode.rv_value))} Ω</span>
          </div>
        )}
        {electrode.target_value != null && (
          <div className="flex items-baseline gap-1.5">
            <span className="text-xs text-muted-foreground">Doelwaarde:</span>
            <span className="text-sm font-medium text-foreground tabular-nums">≤ {formatNlNumber(Number(electrode.target_value))} Ω</span>
          </div>
        )}
      </div>

      {electrode.notes && <p className="text-xs text-muted-foreground mb-4 italic">{electrode.notes}</p>}

      {activePens.map((pen) => {
        const hasPhotos = !!pen.display_photo_url || !!pen.overview_photo_url;
        const showPenHeader = activePens.length > 1;

        return (
          <div key={pen.id} className={`mb-5 page-break-inside-avoid ${showPenHeader ? 'ml-3 pl-4 border-l-2 border-border/60' : ''}`}>
            {showPenHeader && (
              <div className="mb-1.5">
                <p className="text-xs font-semibold text-foreground">
                  Pen {pen.pen_code}
                  {pen.label && <span className="font-normal text-muted-foreground ml-1.5">— {pen.label}</span>}
                </p>
                {pen.pen_depth_meters != null && (
                  <p className="text-[10px] text-muted-foreground">Pendiepte: {formatNlNumber(Number(pen.pen_depth_meters), 1)} m</p>
                )}
              </div>
            )}

            {pen.notes && <p className="text-[10px] text-muted-foreground mb-1 italic">{pen.notes}</p>}

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
