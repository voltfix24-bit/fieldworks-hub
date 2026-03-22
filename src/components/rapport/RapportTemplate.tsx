import { useEffect } from 'react';

export interface RapportData {
  project_naam: string;
  project_nummer: string;
  project_adres: string;
  meetdatum: string;
  logo_url: string | null;
  merk_kleur: string;
  bedrijf_naam: string;
  bedrijf_adres: string;
  bedrijf_telefoon: string;
  bedrijf_email: string;
  bedrijf_website: string;
  klant_naam: string;
  klant_contact: string;
  monteur_naam: string;
  apparaat_naam: string;
  apparaat_merk: string;
  apparaat_model: string;
  apparaat_serienummer: string;
  kalibratie_datum: string;
  volgende_kalibratie: string;
  elektrodes: RapportElektrode[];
  handtekening_b64: string | null;
  monteur_naam_ondertekening: string;
}

export interface RapportElektrode {
  nummer: number;
  code: string;
  eindtype: 'RA' | 'RV';
  eindwaarde: number | null;
  target_value: number | null;
  rv_ok: boolean;
  notes: string | null;
  pennen: {
    code: string;
    metingen: { diepte: number; waarde: number | null }[];
  }[];
  foto_display_url: string | null;
  foto_overzicht_url: string | null;
}

interface Props {
  data: RapportData;
  onReady: () => void;
}

/* ── Helpers ─────────────────────────── */

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function fmt(n: number | null): string {
  if (n === null || n === undefined) return '—';
  return n.toFixed(2).replace('.', ',');
}

function fmtDate(d: string): string {
  if (!d) return '—';
  const parts = d.split('-');
  if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
  return d;
}

/* ── Shared page wrapper ─────────────── */

const PAGE_W = '794px';
const PAGE_H = '1123px';
const FONT = '"Inter", "DM Sans", system-ui, -apple-system, "Segoe UI", sans-serif';

const basePage: React.CSSProperties = {
  width: PAGE_W,
  minHeight: PAGE_H,
  background: '#ffffff',
  boxSizing: 'border-box',
  position: 'relative',
  overflow: 'hidden',
  fontFamily: FONT,
  color: '#1D1D1F',
};

/* ── Footer component ────────────────── */

function PageFooter({ bedrijf, adres, email, website, pagina, kleur }: {
  bedrijf: string; adres: string; email: string; website: string; pagina: number; kleur: string;
}) {
  return (
    <div style={{
      position: 'absolute', bottom: '0', left: '0', right: '0',
      padding: '14px 48px',
      borderTop: `1px solid ${hexToRgba(kleur, 0.15)}`,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      fontSize: '8px', color: '#AEAEB2', letterSpacing: '0.3px',
    }}>
      <span>{bedrijf}{adres ? ` · ${adres}` : ''}</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {email && <span>{email}</span>}
        {website && <span>{website}</span>}
        <span style={{
          background: hexToRgba(kleur, 0.08), borderRadius: '4px',
          padding: '2px 8px', fontWeight: '600', color: '#636366',
        }}>
          {pagina}
        </span>
      </span>
    </div>
  );
}

/* ── Info row component ──────────────── */

function InfoBlock({ title, rows, kleur }: { title: string; rows: [string, string][]; kleur: string }) {
  const filled = rows.filter(([, v]) => v && v.trim() !== '');
  if (filled.length === 0) return null;
  return (
    <div>
      <div style={{
        fontSize: '9px', fontWeight: '700', textTransform: 'uppercase',
        letterSpacing: '1.2px', color: kleur, marginBottom: '10px',
        display: 'flex', alignItems: 'center', gap: '8px',
      }}>
        <span style={{ width: '16px', height: '2px', background: kleur, borderRadius: '1px' }} />
        {title}
      </div>
      {filled.map(([label, value], i) => (
        <div key={i} style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
          padding: '6px 0',
          borderBottom: i < filled.length - 1 ? '1px solid #F0F0F2' : 'none',
        }}>
          <span style={{ fontSize: '9px', color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {label}
          </span>
          <span style={{ fontSize: '11px', fontWeight: '600', color: '#1D1D1F' }}>
            {value}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── Meettabel ───────────────────────── */

function MetingTabel({ elektrode, kleur }: { elektrode: RapportElektrode; kleur: string }) {
  const pennen = elektrode.pennen;
  if (pennen.length === 0) return null;

  const maxRows = Math.max(...pennen.map(p => p.metingen.length));
  if (maxRows === 0) return null;

  const gevuldeRijen: number[] = [];
  for (let i = 0; i < maxRows; i++) {
    if (pennen.some(p => p.metingen[i]?.waarde !== null && p.metingen[i]?.waarde !== undefined)) {
      gevuldeRijen.push(i);
    }
  }
  if (gevuldeRijen.length === 0) return null;

  const isRa = elektrode.eindtype === 'RA';
  let minVal: number | null = null;
  if (isRa) {
    const allVals = pennen.flatMap(p => p.metingen.map(m => m.waarde).filter((w): w is number => w !== null && w > 0));
    minVal = allVals.length > 0 ? Math.min(...allVals) : null;
  }

  return (
    <table style={{
      width: '100%', borderCollapse: 'collapse', fontSize: '10px', marginBottom: '16px',
      borderRadius: '8px', overflow: 'hidden',
    }}>
      <thead>
        <tr>
          <th style={{
            background: kleur, color: '#fff', fontWeight: '700',
            padding: '10px 14px', textAlign: 'left', fontSize: '9px',
            textTransform: 'uppercase', letterSpacing: '0.8px',
          }}>
            Diepte (m)
          </th>
          {pennen.map((p, pi) => (
            <th key={pi} style={{
              background: kleur, color: '#fff', fontWeight: '700',
              padding: '10px 14px', textAlign: 'center', fontSize: '9px',
              textTransform: 'uppercase', letterSpacing: '0.8px',
            }}>
              {p.code} (Ω)
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {gevuldeRijen.map((rowIdx, ri) => {
          const diepte = pennen[0]?.metingen[rowIdx]?.diepte ?? 0;
          return (
            <tr key={rowIdx} style={{ background: ri % 2 === 0 ? '#ffffff' : '#FAFAFA' }}>
              <td style={{
                padding: '8px 14px', borderBottom: '1px solid #F0F0F2',
                fontWeight: '600', color: '#3A3A3C',
                fontVariantNumeric: 'tabular-nums',
              }}>
                {diepte.toFixed(1).replace('.', ',')}
              </td>
              {pennen.map((p, pi) => {
                const w = p.metingen[rowIdx]?.waarde;
                const isLowest = isRa && w !== null && w !== undefined && minVal !== null && Math.abs(w - minVal) < 0.001;
                return (
                  <td key={pi} style={{
                    padding: '8px 14px', borderBottom: '1px solid #F0F0F2',
                    textAlign: 'center', fontVariantNumeric: 'tabular-nums',
                    fontWeight: isLowest ? '800' : '500',
                    color: isLowest ? '#1B7A3A' : '#3A3A3C',
                    background: isLowest ? '#E8F5E9' : 'transparent',
                  }}>
                    {w !== null && w !== undefined ? fmt(w) : '—'}
                  </td>
                );
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/* ══════════════════════════════════════
   RAPPORT TEMPLATE
   ══════════════════════════════════════ */

export function RapportTemplate({ data, onReady }: Props) {
  const kleur = data.merk_kleur || '#F4896B';
  const alleOk = data.elektrodes.every(e => e.rv_ok);
  const totalPages = data.elektrodes.length + 2;

  useEffect(() => {
    const timer = setTimeout(onReady, 800);
    return () => clearTimeout(timer);
  }, [onReady]);

  const footerProps = {
    bedrijf: data.bedrijf_naam, adres: data.bedrijf_adres,
    email: data.bedrijf_email, website: data.bedrijf_website, kleur,
  };

  return (
    <div style={{ width: PAGE_W, fontFamily: FONT }}>

      {/* ═══════════════════════════════
          PAGINA 1 — COVER
          ═══════════════════════════════ */}
      <div data-pdf-page="cover" style={basePage}>
        {/* Top accent bar */}
        <div style={{
          width: '100%', height: '8px',
          background: `linear-gradient(90deg, ${kleur}, ${hexToRgba(kleur, 0.6)})`,
        }} />

        {/* Decorative side accent */}
        <div style={{
          position: 'absolute', left: '0', top: '8px', bottom: '0', width: '4px',
          background: `linear-gradient(180deg, ${kleur}, ${hexToRgba(kleur, 0)})`,
        }} />

        {/* Header with logo */}
        <div style={{ padding: '40px 48px 0' }}>
          {data.logo_url && (
            <img src={data.logo_url} crossOrigin="anonymous" style={{
              maxHeight: '52px', maxWidth: '200px', objectFit: 'contain', marginBottom: '48px',
            }} alt="Logo" />
          )}

          {/* Hero title area */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{
              fontSize: '11px', fontWeight: '700', textTransform: 'uppercase',
              letterSpacing: '3px', color: kleur, marginBottom: '12px',
            }}>
              Technisch Rapport
            </div>
            <h1 style={{
              fontSize: '38px', fontWeight: '800', color: '#1D1D1F',
              margin: '0', lineHeight: '1.1', letterSpacing: '-0.5px',
            }}>
              Aardingsmeting
            </h1>
            <h1 style={{
              fontSize: '38px', fontWeight: '800', color: kleur,
              margin: '4px 0 0', lineHeight: '1.1', letterSpacing: '-0.5px',
            }}>
              Rapport
            </h1>
          </div>

          {/* Accent line */}
          <div style={{
            width: '64px', height: '4px', borderRadius: '2px',
            background: kleur, margin: '24px 0 20px',
          }} />

          {/* Project name + address */}
          <div style={{ marginBottom: '32px' }}>
            <p style={{ fontSize: '20px', fontWeight: '700', color: '#1D1D1F', margin: '0 0 6px' }}>
              {data.project_naam}
            </p>
            {data.project_adres && (
              <p style={{ fontSize: '13px', color: '#636366', margin: '0' }}>{data.project_adres}</p>
            )}
          </div>
        </div>

        {/* Info blocks in cards */}
        <div style={{ padding: '0 48px' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px',
          }}>
            <div style={{
              padding: '20px', borderRadius: '12px',
              background: '#FAFAFA', border: '1px solid #F0F0F2',
            }}>
              <InfoBlock title="Projectgegevens" kleur={kleur} rows={[
                ['Projectnummer', data.project_nummer],
                ['Opdrachtgever', data.klant_naam],
                ['Contactpersoon', data.klant_contact],
                ['Datum', fmtDate(data.meetdatum)],
                ['Monteur', data.monteur_naam],
              ]} />
            </div>
            <div style={{
              padding: '20px', borderRadius: '12px',
              background: '#FAFAFA', border: '1px solid #F0F0F2',
            }}>
              <InfoBlock title="Meetapparatuur" kleur={kleur} rows={[
                ['Apparaat', data.apparaat_naam],
                ['Merk / Model', [data.apparaat_merk, data.apparaat_model].filter(Boolean).join(' ')],
                ['Serienummer', data.apparaat_serienummer],
                ['Kalibratie', fmtDate(data.kalibratie_datum)],
                ['Volgende', fmtDate(data.volgende_kalibratie)],
              ]} />
            </div>
          </div>

          {/* Status banner */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '14px',
            padding: '16px 20px', borderRadius: '12px', marginTop: '24px',
            background: alleOk
              ? 'linear-gradient(135deg, #F0FAF3, #E8F5E9)'
              : 'linear-gradient(135deg, #FFF5F5, #FFEBEE)',
            border: `1px solid ${alleOk ? '#C8E6C9' : '#FFCDD2'}`,
          }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: alleOk ? '#1B7A3A' : '#B71C1C',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: '18px', fontWeight: '800', flexShrink: 0,
            }}>
              {alleOk ? '✓' : '✗'}
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: alleOk ? '#1B7A3A' : '#B71C1C' }}>
                {alleOk ? 'Goedgekeurd' : 'Afgekeurd'}
              </div>
              <div style={{ fontSize: '10px', color: '#636366', marginTop: '2px' }}>
                {alleOk
                  ? 'Alle gemeten waarden voldoen aan de toetswaarde.'
                  : 'Een of meer waarden voldoen niet aan de toetswaarde.'}
              </div>
            </div>
          </div>
        </div>

        <PageFooter {...footerProps} pagina={1} />
      </div>

      {/* ═══════════════════════════════
          PAGINA 2+ — ELEKTRODES
          ═══════════════════════════════ */}
      {data.elektrodes.map((e, idx) => {
        const heeftWaarde = e.eindwaarde !== null;
        const ok = e.rv_ok;
        const target = e.target_value !== null ? `≤ ${fmt(e.target_value)} Ω` : '—';
        const paginaNr = idx + 2;

        return (
          <div key={e.nummer} data-pdf-page={`elektrode-${idx}`} style={basePage}>
            {/* Top bar */}
            <div style={{
              width: '100%', height: '8px',
              background: `linear-gradient(90deg, ${kleur}, ${hexToRgba(kleur, 0.6)})`,
            }} />

            <div style={{ padding: '28px 48px 0' }}>
              {/* Section header */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: '20px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '8px',
                    background: kleur, color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '14px', fontWeight: '800',
                  }}>
                    {e.nummer}
                  </div>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#1D1D1F' }}>
                      {e.code}
                    </div>
                    <div style={{ fontSize: '9px', color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Meetresultaten
                    </div>
                  </div>
                </div>
                <div style={{
                  padding: '6px 14px', borderRadius: '20px',
                  background: ok ? '#E8F5E9' : '#FFEBEE',
                  border: `1px solid ${ok ? '#C8E6C9' : '#FFCDD2'}`,
                  fontSize: '10px', fontWeight: '700',
                  color: ok ? '#1B7A3A' : '#B71C1C',
                }}>
                  {ok ? '● Voldoet' : '● Voldoet niet'}
                </div>
              </div>

              {/* Meetwaarde hero card */}
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr',
                borderRadius: '14px', overflow: 'hidden', marginBottom: '24px',
                border: `1px solid ${ok ? '#C8E6C9' : '#FFCDD2'}`,
              }}>
                <div style={{
                  padding: '20px 24px',
                  background: ok
                    ? 'linear-gradient(135deg, #F0FAF3, #E8F5E9)'
                    : 'linear-gradient(135deg, #FFF5F5, #FFEBEE)',
                }}>
                  <div style={{
                    fontSize: '8px', color: '#8E8E93', textTransform: 'uppercase',
                    letterSpacing: '1px', marginBottom: '6px', fontWeight: '600',
                  }}>
                    {e.eindtype === 'RV' ? 'Aardverspreidingsweerstand (RV)' : 'Aardingsweerstand (RA)'}
                  </div>
                  <div style={{
                    fontSize: '32px', fontWeight: '800', letterSpacing: '-1px',
                    color: ok ? '#1B7A3A' : '#B71C1C',
                  }}>
                    {heeftWaarde ? `${fmt(e.eindwaarde)}` : '—'}
                    <span style={{ fontSize: '16px', fontWeight: '600', marginLeft: '4px' }}>Ω</span>
                  </div>
                </div>
                <div style={{
                  padding: '20px 24px', background: '#FAFAFA',
                  display: 'flex', flexDirection: 'column', justifyContent: 'center',
                }}>
                  <div style={{
                    fontSize: '8px', color: '#8E8E93', textTransform: 'uppercase',
                    letterSpacing: '1px', marginBottom: '6px', fontWeight: '600',
                  }}>
                    Toetswaarde (norm)
                  </div>
                  <div style={{ fontSize: '22px', fontWeight: '700', color: '#3A3A3C' }}>
                    {target}
                  </div>
                </div>
              </div>

              {/* Meettabel */}
              <div style={{
                fontSize: '10px', fontWeight: '700', color: '#3A3A3C',
                marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <span style={{ width: '12px', height: '2px', background: kleur, borderRadius: '1px' }} />
                Meetwaarden per diepte
              </div>

              <MetingTabel elektrode={e} kleur={kleur} />

              <div style={{
                fontSize: '8px', color: '#AEAEB2', marginBottom: '16px',
                padding: '8px 12px', background: '#FAFAFA', borderRadius: '6px',
              }}>
                Meetmethode: 3-punts aardingsweerstandsmeting · Maatgevende waarde: laagste gemeten {e.eindtype} · Toetswaarde: {target}
              </div>

              {e.notes && (
                <div style={{
                  fontSize: '10px', color: '#636366', fontStyle: 'italic',
                  padding: '10px 14px', background: hexToRgba(kleur, 0.04),
                  borderRadius: '8px', marginBottom: '16px',
                  borderLeft: `3px solid ${hexToRgba(kleur, 0.3)}`,
                }}>
                  {e.notes}
                </div>
              )}

              {/* Foto's */}
              {(e.foto_display_url || e.foto_overzicht_url) && (
                <>
                  <div style={{
                    fontSize: '10px', fontWeight: '700', color: '#3A3A3C',
                    marginBottom: '10px', marginTop: '8px', textTransform: 'uppercase',
                    letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '8px',
                  }}>
                    <span style={{ width: '12px', height: '2px', background: kleur, borderRadius: '1px' }} />
                    Documentatiefoto's
                  </div>
                  <div style={{
                    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px',
                  }}>
                    {e.foto_display_url && (
                      <div>
                        <div style={{
                          borderRadius: '10px', overflow: 'hidden',
                          border: '1px solid #F0F0F2',
                        }}>
                          <img src={e.foto_display_url} crossOrigin="anonymous" style={{
                            width: '100%', height: '180px', objectFit: 'cover', display: 'block',
                          }} alt="Meetdisplay" />
                        </div>
                        <div style={{ fontSize: '9px', color: '#8E8E93', textAlign: 'center', marginTop: '6px' }}>
                          Meetdisplay
                        </div>
                      </div>
                    )}
                    {e.foto_overzicht_url && (
                      <div>
                        <div style={{
                          borderRadius: '10px', overflow: 'hidden',
                          border: '1px solid #F0F0F2',
                        }}>
                          <img src={e.foto_overzicht_url} crossOrigin="anonymous" style={{
                            width: '100%', height: '180px', objectFit: 'cover', display: 'block',
                          }} alt="Overzicht" />
                        </div>
                        <div style={{ fontSize: '9px', color: '#8E8E93', textAlign: 'center', marginTop: '6px' }}>
                          Overzichtsfoto
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <PageFooter {...footerProps} pagina={paginaNr} />
          </div>
        );
      })}

      {/* ═══════════════════════════════
          LAATSTE PAGINA — SAMENVATTING
          ═══════════════════════════════ */}
      <div data-pdf-page="samenvatting" style={basePage}>
        <div style={{
          width: '100%', height: '8px',
          background: `linear-gradient(90deg, ${kleur}, ${hexToRgba(kleur, 0.6)})`,
        }} />

        <div style={{ padding: '28px 48px 0' }}>
          {/* Section header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px',
          }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px',
              background: kleur, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '13px', fontWeight: '800',
            }}>
              Σ
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#1D1D1F' }}>
                Samenvatting & Conclusie
              </div>
              <div style={{ fontSize: '9px', color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Overzicht meetresultaten
              </div>
            </div>
          </div>

          {/* Summary table */}
          <table style={{
            width: '100%', borderCollapse: 'collapse', fontSize: '10px',
            marginBottom: '24px', borderRadius: '10px', overflow: 'hidden',
          }}>
            <thead>
              <tr>
                <th style={{
                  background: kleur, color: '#fff', fontWeight: '700',
                  padding: '12px 14px', textAlign: 'left', fontSize: '9px',
                  textTransform: 'uppercase', letterSpacing: '0.8px',
                }}>
                  Elektrode
                </th>
                {['Type', 'Gemeten waarde', 'Toetswaarde', 'Resultaat'].map(h => (
                  <th key={h} style={{
                    background: kleur, color: '#fff', fontWeight: '700',
                    padding: '12px 14px', textAlign: 'center', fontSize: '9px',
                    textTransform: 'uppercase', letterSpacing: '0.8px',
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.elektrodes.map((e, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? '#ffffff' : '#FAFAFA' }}>
                  <td style={{
                    padding: '10px 14px', borderBottom: '1px solid #F0F0F2',
                    fontWeight: '600', color: '#1D1D1F',
                  }}>
                    {e.code}
                  </td>
                  <td style={{
                    padding: '10px 14px', borderBottom: '1px solid #F0F0F2',
                    textAlign: 'center', color: '#636366',
                  }}>
                    {e.eindtype}
                  </td>
                  <td style={{
                    padding: '10px 14px', borderBottom: '1px solid #F0F0F2',
                    textAlign: 'center', fontWeight: '700',
                    fontVariantNumeric: 'tabular-nums',
                    color: e.rv_ok ? '#1B7A3A' : '#B71C1C',
                  }}>
                    {e.eindwaarde !== null ? `${fmt(e.eindwaarde)} Ω` : '—'}
                  </td>
                  <td style={{
                    padding: '10px 14px', borderBottom: '1px solid #F0F0F2',
                    textAlign: 'center', fontVariantNumeric: 'tabular-nums',
                  }}>
                    {e.target_value !== null ? `≤ ${fmt(e.target_value)} Ω` : '—'}
                  </td>
                  <td style={{
                    padding: '10px 14px', borderBottom: '1px solid #F0F0F2',
                    textAlign: 'center',
                  }}>
                    <span style={{
                      display: 'inline-block', padding: '3px 10px', borderRadius: '12px',
                      fontSize: '9px', fontWeight: '700',
                      background: e.rv_ok ? '#E8F5E9' : '#FFEBEE',
                      color: e.rv_ok ? '#1B7A3A' : '#B71C1C',
                    }}>
                      {e.rv_ok ? 'Voldoet' : 'Voldoet niet'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Conclusion card */}
          <div style={{
            borderRadius: '14px', overflow: 'hidden', marginBottom: '24px',
          }}>
            <div style={{
              padding: '28px 28px 20px',
              background: alleOk
                ? 'linear-gradient(135deg, #1D3D28, #1B7A3A)'
                : 'linear-gradient(135deg, #5C1010, #B71C1C)',
              color: '#ffffff',
            }}>
              <div style={{
                fontSize: '8px', textTransform: 'uppercase', letterSpacing: '1.5px',
                color: 'rgba(255,255,255,0.5)', marginBottom: '10px', fontWeight: '600',
              }}>
                Conclusie & Beoordeling
              </div>
              <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px', lineHeight: '1.4' }}>
                {alleOk
                  ? 'De gemeten waarden voldoen aan de opgegeven toetswaarde.'
                  : 'Een of meer waarden voldoen niet aan de toetswaarde.'}
              </div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.65)', lineHeight: '1.6' }}>
                {alleOk
                  ? 'Op basis van de uitgevoerde metingen zijn geen afwijkingen vastgesteld ten opzichte van de ingestelde toetswaarde.'
                  : 'Op basis van de uitgevoerde metingen zijn afwijkingen vastgesteld. Zie de meetresultaten per elektrode voor details.'}
              </div>
            </div>

            {/* Electrode summary chips */}
            <div style={{
              display: 'flex', gap: '0',
              background: alleOk ? '#163D24' : '#4A0E0E',
            }}>
              {data.elektrodes.map((e, i) => (
                <div key={i} style={{
                  flex: '1', padding: '16px 14px', textAlign: 'center',
                  borderRight: i < data.elektrodes.length - 1
                    ? '1px solid rgba(255,255,255,0.08)' : 'none',
                }}>
                  <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px', fontWeight: '600' }}>
                    {e.code}
                  </div>
                  <div style={{
                    fontSize: '20px', fontWeight: '800', color: '#ffffff',
                    letterSpacing: '-0.5px',
                  }}>
                    {e.eindwaarde !== null ? fmt(e.eindwaarde) : '—'}
                    <span style={{ fontSize: '10px', fontWeight: '600', marginLeft: '2px' }}>Ω</span>
                  </div>
                  <div style={{
                    fontSize: '8px', marginTop: '4px', fontWeight: '700',
                    color: e.rv_ok ? '#81C784' : '#EF9A9A',
                  }}>
                    {e.rv_ok ? '● Voldoet' : '● Voldoet niet'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Signature block */}
          {data.handtekening_b64 && (
            <div style={{
              padding: '24px', borderRadius: '14px',
              border: '1px solid #F0F0F2', background: '#FAFAFA',
            }}>
              <div style={{
                fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px',
                color: '#8E8E93', fontWeight: '700', marginBottom: '16px',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <span style={{ width: '12px', height: '2px', background: kleur, borderRadius: '1px' }} />
                Ondertekening
              </div>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
              }}>
                <div>
                  <img
                    src={`data:image/png;base64,${data.handtekening_b64}`}
                    style={{ width: '200px', height: '80px', objectFit: 'contain' }}
                    alt="Handtekening"
                  />
                  <div style={{
                    borderTop: '2px solid #1D1D1F', paddingTop: '8px', marginTop: '10px',
                    width: '200px',
                  }}>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#1D1D1F' }}>
                      {data.monteur_naam_ondertekening}
                    </div>
                    <div style={{ fontSize: '9px', color: '#8E8E93', marginTop: '2px' }}>
                      Uitvoerend monteur
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '9px', color: '#8E8E93', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Datum
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#1D1D1F', marginTop: '4px' }}>
                    {fmtDate(data.meetdatum)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <PageFooter {...footerProps} pagina={totalPages} />
      </div>
    </div>
  );
}
