import { ReportElectrode } from '@/hooks/use-report-data';
import { ReportImageBlock } from './ReportImageBlock';
import { formatNlNumber } from '@/lib/nl-number';

interface ReportElectrodeSectionProps {
  electrode: ReportElectrode;
  index: number;
  totalElectrodes: number;
  showPhotos?: boolean;
}

/** Strip redundant prefix: if electrode_code is "Elektrode 1", just use "1" */
function cleanCode(code: string, prefix: string): string {
  const lower = code.toLowerCase().trim();
  const p = prefix.toLowerCase();
  if (lower.startsWith(p)) return code.trim().slice(prefix.length).trim();
  return code.trim();
}

export function ReportElectrodeSection({ electrode, index, showPhotos = true }: ReportElectrodeSectionProps) {
  const activePens = electrode.pens.filter(
    pen => pen.measurements.some(m => m.resistance_value > 0)
  );
  if (activePens.length === 0) return null;

  const hasRv = electrode.rv_value != null && electrode.rv_value > 0;
  const resultType = hasRv ? 'RV' : 'RA';
  const resultValue = hasRv ? Number(electrode.rv_value) : electrode.ra_value != null ? Number(electrode.ra_value) : null;
  const targetValue = electrode.target_value != null ? Number(electrode.target_value) : null;
  const hasTarget = targetValue != null && targetValue > 0;
  const hasResult = resultValue != null && resultValue > 0;
  const canJudge = hasTarget && hasResult;
  const isOk = canJudge ? (resultValue as number) <= (targetValue as number) : null;

  const electrodeDisplay = electrode.electrode_code
    ? cleanCode(electrode.electrode_code, 'Elektrode')
    : String(index + 1);

  const depthSet = new Set<number>();
  activePens.forEach(pen =>
    pen.measurements.forEach(m => {
      if (m.resistance_value > 0) depthSet.add(m.depth_meters);
    })
  );
  const depths = Array.from(depthSet).sort((a, b) => a - b);

  const valueLookup = new Map<string, Map<number, number>>();
  activePens.forEach(pen => {
    const map = new Map<number, number>();
    pen.measurements.forEach(m => {
      if (m.resistance_value > 0) map.set(m.depth_meters, m.resistance_value);
    });
    valueLookup.set(pen.id, map);
  });

  const photos: { url: string; label: string }[] = [];
  activePens.forEach(pen => {
    if (pen.display_photo_url) photos.push({ url: pen.display_photo_url, label: 'Meetdisplay' });
    if (pen.overview_photo_url) photos.push({ url: pen.overview_photo_url, label: 'Overzichtsfoto' });
  });

  // Tones using design tokens
  const okStyle = { background: 'var(--pass-bg)', color: 'var(--pass)', border: '1px solid #c9e3d3' };
  const failStyle = { background: '#fdecec', color: '#b3261e', border: '1px solid #f1c4c0' };
  const neutralStyle = { background: 'var(--panel)', color: 'var(--ink)', border: '1px solid var(--line)' };

  return (
    <section className="report-electrode" style={{
      breakInside: 'avoid',
      border: '1px solid var(--line)',
      background: '#fff',
      borderRadius: '10px',
      padding: '14px 16px',
      marginBottom: '14px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <div style={{
            width: '26px', height: '26px', borderRadius: '6px',
            background: 'var(--brand)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '10pt', fontWeight: 700,
            fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
          }}>{index + 1}</div>
          <div style={{ minWidth: 0 }}>
            <h3 style={{
              fontSize: '12pt', fontWeight: 700, color: 'var(--ink)',
              letterSpacing: '-0.01em', margin: 0, lineHeight: 1.2,
            }}>
              Meetresultaten — Elektrode <span className="tabular-nums">{electrodeDisplay}</span>
            </h3>
            {electrode.label && (
              <p style={{ fontSize: '9pt', color: 'var(--muted)', margin: '2px 0 0' }}>{electrode.label}</p>
            )}
          </div>
        </div>
        {canJudge && (
          <div style={{
            ...(isOk ? okStyle : failStyle),
            borderRadius: '999px',
            padding: '4px 10px',
            fontSize: '8pt',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}>
            {isOk ? 'Voldoet' : 'Voldoet niet'}
          </div>
        )}
      </div>

      {/* Result + target strip */}
      {hasResult && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: hasTarget ? '1fr 1fr' : '1fr',
          border: '1px solid var(--line)',
          borderRadius: '10px',
          overflow: 'hidden',
          marginBottom: '14px',
        }}>
          <div style={{
            ...(isOk === true ? okStyle : isOk === false ? failStyle : neutralStyle),
            border: 'none',
            padding: '12px 14px',
          }}>
            <p style={{
              fontSize: '7.5pt', fontWeight: 700, letterSpacing: '0.13em',
              textTransform: 'uppercase', color: 'var(--muted)', margin: 0,
            }}>
              {resultType === 'RV' ? 'Aardverspreidingsweerstand (RV)' : 'Aardingsweerstand (RA)'}
            </p>
            <p className="tabular-nums" style={{
              fontSize: '22pt', fontWeight: 700, lineHeight: 1, margin: '6px 0 0',
              letterSpacing: '-0.01em',
              color: isOk === true ? 'var(--pass)' : isOk === false ? '#b3261e' : 'var(--ink)',
            }}>
              {formatNlNumber(resultValue as number)}
              <span style={{ fontSize: '12pt', fontWeight: 700, marginLeft: '4px' }}>Ω</span>
            </p>
          </div>
          {hasTarget && (
            <div style={{ background: 'var(--panel)', padding: '12px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <p style={{
                fontSize: '7.5pt', fontWeight: 700, letterSpacing: '0.13em',
                textTransform: 'uppercase', color: 'var(--muted)', margin: 0,
              }}>Toetswaarde</p>
              <p className="tabular-nums" style={{
                fontSize: '16pt', fontWeight: 700, color: 'var(--ink)', margin: '6px 0 0',
              }}>
                ≤ {formatNlNumber(targetValue as number)} Ω
              </p>
              {canJudge && (
                <p style={{
                  fontSize: '8.5pt', fontWeight: 600, margin: '4px 0 0',
                  color: isOk ? 'var(--pass)' : '#b3261e',
                }}>
                  {isOk ? 'Binnen grenswaarde' : 'Buiten grenswaarde'}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Notes */}
      {electrode.notes && (
        <p style={{
          background: 'var(--panel)',
          borderLeft: '3px solid var(--brand)',
          padding: '8px 12px',
          fontSize: '9pt',
          fontStyle: 'italic',
          color: 'var(--ink)',
          marginBottom: '10px',
          borderRadius: '4px',
        }}>{electrode.notes}</p>
      )}

      {/* Depth table */}
      {depths.length > 0 && (
        <div style={{ marginBottom: '8px' }}>
          <h4 style={{
            fontSize: '7.5pt', fontWeight: 700, letterSpacing: '0.13em',
            textTransform: 'uppercase', color: 'var(--ink)',
            margin: '0 0 6px',
          }}>Meetwaarden per diepte</h4>
          <div style={{
            border: '1px solid var(--line)',
            borderRadius: '8px',
            overflow: 'hidden',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '9.5pt', tableLayout: 'fixed' }}>
              <thead>
                <tr style={{ background: 'var(--brand)', color: '#fff' }}>
                  <th style={{
                    padding: '7px 10px', textAlign: 'left',
                    fontSize: '7.5pt', fontWeight: 700, letterSpacing: '0.1em',
                    textTransform: 'uppercase', whiteSpace: 'nowrap',
                    fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
                  }}>Diepte (m)</th>
                  {activePens.map(pen => {
                    const penDisplay = cleanCode(pen.pen_code, 'Pen');
                    return (
                      <th key={pen.id} style={{
                        padding: '7px 10px', textAlign: 'right',
                        fontSize: '7.5pt', fontWeight: 700, letterSpacing: '0.1em',
                        textTransform: 'uppercase', whiteSpace: 'nowrap',
                        fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
                      }}>
                        {activePens.length > 1 ? `Pen ${penDisplay} (Ω)` : 'Weerstand (Ω)'}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {depths.map((depth, rowIndex) => (
                  <tr key={depth} style={{ background: rowIndex % 2 === 0 ? '#fff' : 'var(--panel)' }}>
                    <td className="tabular-nums" style={{
                      borderTop: '1px solid var(--line)',
                      padding: '6px 10px', fontWeight: 600, color: 'var(--ink)',
                    }}>{formatNlNumber(depth, 1)}</td>
                    {activePens.map(pen => {
                      const val = valueLookup.get(pen.id)?.get(depth);
                      const valueOk = hasTarget && val != null && val <= (targetValue as number);
                      if (val == null) {
                        return <td key={pen.id} style={{
                          borderTop: '1px solid var(--line)',
                          padding: '6px 10px', textAlign: 'right', color: 'var(--muted)',
                        }} />;
                      }
                      return (
                        <td key={pen.id} className="tabular-nums" style={{
                          borderTop: '1px solid var(--line)',
                          padding: '6px 10px', textAlign: 'right',
                          fontWeight: valueOk ? 700 : 600,
                          color: valueOk ? 'var(--pass)' : 'var(--ink)',
                          background: valueOk ? 'var(--pass-bg)' : 'transparent',
                        }}>
                          {formatNlNumber(val)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showPhotos && photos.length > 0 && <ReportImageBlock images={photos} />}
    </section>
  );
}
