import { ReportElectrode } from '@/hooks/use-report-data';
import { ReportMeasurementTable } from './ReportMeasurementTable';
import { ReportImageBlock } from './ReportImageBlock';

interface ReportElectrodeSectionProps {
  electrode: ReportElectrode;
  index: number;
}

export function ReportElectrodeSection({ electrode, index }: ReportElectrodeSectionProps) {
  return (
    <div className="report-electrode mb-6 page-break-inside-avoid">
      {/* Electrode header */}
      <div className="flex items-center gap-3 mb-3 pb-2 border-b border-border">
        <div className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold tenant-primary-bg text-white">
          {index + 1}
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-foreground">
            Electrode {electrode.electrode_code}
            {electrode.label && <span className="font-normal text-muted-foreground"> — {electrode.label}</span>}
          </h3>
          <div className="flex flex-wrap items-center gap-3 mt-0.5">
            {electrode.ra_value != null && (
              <span className="text-xs font-medium tenant-accent-text">RA: {Number(electrode.ra_value).toFixed(2)} Ω</span>
            )}
            {electrode.rv_value != null && (
              <span className="text-xs font-medium text-foreground">RV: {Number(electrode.rv_value).toFixed(2)} Ω</span>
            )}
            {electrode.target_value != null && (
              <span className="text-xs text-muted-foreground">Target: {Number(electrode.target_value).toFixed(2)} Ω</span>
            )}
            {electrode.is_coupled && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 tenant-primary-text font-medium">Coupled</span>
            )}
            {electrode.target_met === true && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-700 font-medium">Target met ✓</span>
            )}
            {electrode.target_met === false && electrode.target_value != null && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 font-medium">Below target</span>
            )}
          </div>
        </div>
      </div>

      {electrode.notes && (
        <p className="text-xs text-muted-foreground mb-3 italic">{electrode.notes}</p>
      )}

      {/* Pens */}
      {electrode.pens.map((pen, penIndex) => {
        const lowestResistance = pen.measurements.length > 0
          ? Math.min(...pen.measurements.map(m => m.resistance_value))
          : null;

        return (
          <div key={pen.id} className="ml-4 mb-4 pl-4 border-l-2 border-accent/20 page-break-inside-avoid">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-xs font-semibold text-foreground">
                  Pen {pen.pen_code}
                  {pen.label && <span className="font-normal text-muted-foreground"> — {pen.label}</span>}
                </p>
                {pen.pen_depth_meters != null && (
                  <p className="text-[10px] text-muted-foreground">Depth: {Number(pen.pen_depth_meters).toFixed(1)} m</p>
                )}
              </div>
              {lowestResistance != null && (
                <span className="text-xs font-medium tenant-accent-text">
                  Lowest: {lowestResistance.toFixed(2)} Ω
                </span>
              )}
            </div>

            {pen.notes && (
              <p className="text-[10px] text-muted-foreground mb-2 italic">{pen.notes}</p>
            )}

            {/* Measurement table */}
            <ReportMeasurementTable measurements={pen.measurements} lowestResistance={lowestResistance} />

            {/* Photos */}
            <ReportImageBlock
              images={[
                { url: pen.display_photo_url || '', label: 'Display photo' },
                { url: pen.overview_photo_url || '', label: 'Overview photo' },
              ]}
            />
          </div>
        );
      })}
    </div>
  );
}
