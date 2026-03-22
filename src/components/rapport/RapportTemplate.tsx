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

const S = {
  page: {
    width: '794px',
    background: '#ffffff',
    fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
    color: '#1D1D1F',
    position: 'relative' as const,
    boxSizing: 'border-box' as const,
    padding: '0',
  },
  pdfPage: {
    width: '794px',
    minHeight: '1123px',
    background: '#ffffff',
    boxSizing: 'border-box' as const,
    position: 'relative' as const,
    overflow: 'hidden' as const,
  },
  topStripe: (kleur: string) => ({
    width: '100%',
    height: '6px',
    background: kleur,
  }),
  headerArea: {
    padding: '32px 40px 0',
  },
  logo: {
    maxHeight: '48px',
    maxWidth: '180px',
    objectFit: 'contain' as const,
    marginBottom: '24px',
  },
  title: {
    fontSize: '32px',
    fontWeight: '800' as const,
    margin: '0 0 4px',
    lineHeight: '1.15',
  },
  subtitle: (kleur: string) => ({
    fontSize: '32px',
    fontWeight: '800' as const,
    color: kleur,
    margin: '0 0 16px',
    lineHeight: '1.15',
  }),
  body: {
    padding: '0 40px',
  },
  infoGrid: {
    display: 'grid' as const,
    gridTemplateColumns: '1fr 1fr',
    gap: '24px',
    marginBottom: '24px',
  },
  infoBlock: {
    marginBottom: '0',
  },
  infoTitle: (kleur: string) => ({
    fontSize: '10px',
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.8px',
    color: kleur,
    marginBottom: '8px',
  }),
  infoRow: {
    display: 'flex' as const,
    justifyContent: 'space-between' as const,
    borderBottom: '1px solid #E5E5E7',
    padding: '5px 0',
  },
  infoLabel: {
    fontSize: '10px',
    color: '#636366',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.4px',
  },
  infoValue: {
    fontSize: '12px',
    fontWeight: '600' as const,
    color: '#1D1D1F',
  },
  statusBox: (ok: boolean) => ({
    display: 'flex' as const,
    alignItems: 'center' as const,
    gap: '10px',
    padding: '14px 18px',
    borderRadius: '10px',
    background: ok ? '#F0FAF3' : '#FDF2F2',
    borderLeft: `4px solid ${ok ? '#1B7A3A' : '#B71C1C'}`,
    marginTop: '20px',
    marginBottom: '20px',
  }),
  statusText: (ok: boolean) => ({
    fontSize: '13px',
    fontWeight: '700' as const,
    color: ok ? '#1B7A3A' : '#B71C1C',
  }),
  sectionTitle: (kleur: string) => ({
    fontSize: '16px',
    fontWeight: '700' as const,
    color: '#1D1D1F',
    borderBottom: `2px solid ${kleur}`,
    paddingBottom: '6px',
    marginTop: '32px',
    marginBottom: '14px',
  }),
  sectionNum: (kleur: string) => ({
    color: kleur,
    marginRight: '8px',
  }),
  elektrodeHeader: (ok: boolean) => ({
    display: 'flex' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    padding: '12px 16px',
    borderRadius: '8px',
    background: ok ? '#F0FAF3' : '#FDF2F2',
    borderLeft: `4px solid ${ok ? '#1B7A3A' : '#B71C1C'}`,
    marginBottom: '12px',
  }),
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: '11px',
    marginBottom: '12px',
  },
  th: (kleur: string) => ({
    background: kleur,
    color: '#ffffff',
    fontWeight: '700' as const,
    padding: '8px 10px',
    textAlign: 'center' as const,
    fontSize: '10px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.4px',
  }),
  thFirst: (kleur: string) => ({
    background: kleur,
    color: '#ffffff',
    fontWeight: '700' as const,
    padding: '8px 10px',
    textAlign: 'left' as const,
    fontSize: '10px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.4px',
  }),
  td: {
    padding: '6px 10px',
    borderBottom: '1px solid #E5E5E7',
    textAlign: 'right' as const,
    fontVariantNumeric: 'tabular-nums' as const,
  },
  tdFirst: {
    padding: '6px 10px',
    borderBottom: '1px solid #E5E5E7',
    textAlign: 'left' as const,
    fontWeight: '600' as const,
  },
  tdLow: {
    padding: '6px 10px',
    borderBottom: '1px solid #E5E5E7',
    textAlign: 'right' as const,
    fontWeight: '700' as const,
    color: '#1B7A3A',
  },
  foto: {
    width: '100%',
    maxHeight: '200px',
    objectFit: 'cover' as const,
    borderRadius: '8px',
    marginBottom: '6px',
  },
  fotoCaption: {
    fontSize: '10px',
    color: '#636366',
    textAlign: 'center' as const,
    marginBottom: '12px',
  },
  fotoGrid: {
    display: 'grid' as const,
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    marginTop: '12px',
    marginBottom: '16px',
  },
  pageBreak: {
    paddingTop: '32px',
  },
  footer: {
    padding: '16px 40px',
    borderTop: '1px solid #D2D2D7',
    fontSize: '9px',
    color: '#AEAEB2',
    display: 'flex' as const,
    justifyContent: 'space-between' as const,
    marginTop: '32px',
  },
  signBlock: {
    marginTop: '24px',
    padding: '20px',
    border: '1px solid #E5E5E7',
    borderRadius: '10px',
  },
  signImage: {
    width: '200px',
    height: '80px',
    objectFit: 'contain' as const,
  },
  conclusieCard: (ok: boolean) => ({
    padding: '24px',
    borderRadius: '10px',
    background: ok ? '#23232A' : '#7A1212',
    color: '#ffffff',
    marginTop: '20px',
    marginBottom: '20px',
  }),
  notes: {
    fontSize: '11px',
    color: '#636366',
    fontStyle: 'italic' as const,
    padding: '8px 12px',
    background: '#F9F9FB',
    borderRadius: '6px',
    marginBottom: '12px',
  },
};

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

function InfoBlock({ title, rows, kleur }: { title: string; rows: [string, string][]; kleur: string }) {
  const filled = rows.filter(([, v]) => v && v.trim() !== '');
  if (filled.length === 0) return null;
  return (
    <div style={S.infoBlock}>
      <div style={S.infoTitle(kleur)}>{title}</div>
      {filled.map(([label, value], i) => (
        <div key={i} style={S.infoRow}>
          <span style={S.infoLabel}>{label}</span>
          <span style={S.infoValue}>{value}</span>
        </div>
      ))}
    </div>
  );
}

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

  // Find lowest value for RA highlighting
  const isRa = elektrode.eindtype === 'RA';
  let minVal: number | null = null;
  if (isRa) {
    const allVals = pennen.flatMap(p => p.metingen.map(m => m.waarde).filter((w): w is number => w !== null && w > 0));
    minVal = allVals.length > 0 ? Math.min(...allVals) : null;
  }

  return (
    <table style={S.table}>
      <thead>
        <tr>
          <th style={S.thFirst(kleur)}>Diepte (m)</th>
          {pennen.map((p, pi) => (
            <th key={pi} style={S.th(kleur)}>{p.code} (Ω)</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {gevuldeRijen.map((rowIdx) => {
          const diepte = pennen[0]?.metingen[rowIdx]?.diepte ?? 0;
          return (
            <tr key={rowIdx} style={{ background: rowIdx % 2 === 1 ? '#F5F5F7' : '#ffffff' }}>
              <td style={S.tdFirst}>{diepte.toFixed(1).replace('.', ',')}</td>
              {pennen.map((p, pi) => {
                const w = p.metingen[rowIdx]?.waarde;
                const isLowest = isRa && w !== null && w !== undefined && minVal !== null && Math.abs(w - minVal) < 0.001;
                return (
                  <td key={pi} style={isLowest ? S.tdLow : S.td}>
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

export function RapportTemplate({ data, onReady }: Props) {
  const kleur = data.merk_kleur || '#F4896B';
  const alleOk = data.elektrodes.every(e => e.rv_ok);

  useEffect(() => {
    // Wait for images to load
    const timer = setTimeout(onReady, 800);
    return () => clearTimeout(timer);
  }, [onReady]);

  return (
    <div style={S.page}>
      {/* ═══ COVER (pagina 1) ═══ */}
      <div data-pdf-page="cover" style={S.pdfPage}>
        <div style={S.topStripe(kleur)} />
        <div style={S.headerArea}>
          {data.logo_url && (
            <img src={data.logo_url} crossOrigin="anonymous" style={S.logo} alt="Logo" />
          )}
          <h1 style={S.title}>Aardingsmeting</h1>
          <h1 style={S.subtitle(kleur)}>Rapport</h1>
          <div style={{ width: '80px', height: '3px', background: kleur, marginBottom: '20px' }} />
          <p style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 4px' }}>{data.project_naam}</p>
          <p style={{ fontSize: '12px', color: '#636366', margin: '0 0 20px' }}>{data.project_adres}</p>
        </div>

        <div style={S.body}>
          <div style={{ borderTop: '1px solid #D2D2D7', marginBottom: '20px' }} />

          <div style={S.infoGrid}>
            <InfoBlock title="Projectgegevens" kleur={kleur} rows={[
              ['Projectnummer', data.project_nummer],
              ['Opdrachtgever', data.klant_naam],
              ['Contactpersoon', data.klant_contact],
              ['Datum uitvoering', fmtDate(data.meetdatum)],
              ['Monteur', data.monteur_naam],
            ]} />
            <InfoBlock title="Meetapparatuur" kleur={kleur} rows={[
              ['Apparaat', data.apparaat_naam],
              ['Merk / Model', [data.apparaat_merk, data.apparaat_model].filter(Boolean).join(' ')],
              ['Serienummer', data.apparaat_serienummer],
              ['Kalibratiedatum', fmtDate(data.kalibratie_datum)],
              ['Volgende kalibratie', fmtDate(data.volgende_kalibratie)],
            ]} />
          </div>

          <div style={S.statusBox(alleOk)}>
            <span style={{ fontSize: '18px' }}>{alleOk ? '✓' : '✗'}</span>
            <span style={S.statusText(alleOk)}>
              {alleOk
                ? 'De gemeten waarden voldoen aan de opgegeven toetswaarde.'
                : 'Een of meer waarden voldoen niet aan de toetswaarde.'}
            </span>
          </div>
        </div>

        <div style={S.footer}>
          <span>{data.bedrijf_naam} · {data.bedrijf_adres}</span>
          <span>{data.bedrijf_email} · {data.bedrijf_website}</span>
        </div>
      </div>

      {/* ═══ ELECTRODE PAGES ═══ */}
      {data.elektrodes.map((e, idx) => {
        const heeftWaarde = e.eindwaarde !== null;
        const ok = e.rv_ok;
        const target = e.target_value !== null ? `≤ ${fmt(e.target_value)} Ω` : '—';

        return (
          <div key={e.nummer} data-pdf-page={`elektrode-${idx}`} style={S.pdfPage}>
            <div style={S.topStripe(kleur)} />
            <div style={{ ...S.body, paddingTop: '32px' }}>
              <div style={S.sectionTitle(kleur)}>
                <span style={S.sectionNum(kleur)}>{e.nummer}.</span>
                Meetresultaten — {e.code}
              </div>

              <div style={S.elektrodeHeader(ok)}>
                <div>
                  <div style={{ fontSize: '9px', color: '#636366', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                    {e.eindtype === 'RV' ? 'AARDVERSPREIDINGSWEERSTAND (RV)' : 'AARDINGSWEERSTAND (RA)'}
                  </div>
                  <div style={{ fontSize: '22px', fontWeight: '800', color: ok ? '#1B7A3A' : '#B71C1C' }}>
                    {heeftWaarde ? `${fmt(e.eindwaarde)} Ω` : '— Ω'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '9px', color: '#636366', textTransform: 'uppercase', marginBottom: '4px' }}>Toetswaarde</div>
                  <div style={{ fontSize: '14px', fontWeight: '600' }}>{target}</div>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: ok ? '#1B7A3A' : '#B71C1C', marginTop: '4px' }}>
                    {ok ? 'Voldoet' : 'Voldoet niet'}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '11px', fontWeight: '600', color: '#3A3A3C', marginBottom: '8px' }}>
                Meetwaarden per diepte
              </div>

              <MetingTabel elektrode={e} kleur={kleur} />

              <div style={{ fontSize: '9px', color: '#AEAEB2', marginBottom: '12px' }}>
                Meetmethode: 3-punts · Maatgevende waarde: laagste gemeten {e.eindtype} · Toetswaarde: {target}
              </div>

              {e.notes && <div style={S.notes}>{e.notes}</div>}

              {(e.foto_display_url || e.foto_overzicht_url) && (
                <>
                  <div style={{ fontSize: '11px', fontWeight: '600', color: '#3A3A3C', marginBottom: '8px', marginTop: '16px' }}>
                    Documentatiefoto's
                  </div>
                  <div style={S.fotoGrid}>
                    {e.foto_display_url && (
                      <div>
                        <img src={e.foto_display_url} crossOrigin="anonymous" style={S.foto} alt="Meetdisplay" />
                        <div style={S.fotoCaption as any}>Meetdisplay</div>
                      </div>
                    )}
                    {e.foto_overzicht_url && (
                      <div>
                        <img src={e.foto_overzicht_url} crossOrigin="anonymous" style={S.foto} alt="Overzicht" />
                        <div style={S.fotoCaption as any}>Overzichtsfoto</div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div style={{ ...S.footer, position: 'absolute' as const, bottom: '0', left: '0', right: '0' }}>
              <span>{data.bedrijf_naam} · {data.bedrijf_adres}</span>
              <span>Pagina {idx + 2}</span>
            </div>
          </div>
        );
      })}

      {/* ═══ SUMMARY + CONCLUSION ═══ */}
      <div data-pdf-page="samenvatting" style={S.pdfPage}>
        <div style={S.topStripe(kleur)} />
        <div style={{ ...S.body, paddingTop: '32px' }}>
          <div style={S.sectionTitle(kleur)}>Samenvatting & Conclusie</div>

          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.thFirst(kleur)}>Elektrode</th>
                <th style={S.th(kleur)}>Type</th>
                <th style={S.th(kleur)}>Waarde</th>
                <th style={S.th(kleur)}>Toetswaarde</th>
                <th style={S.th(kleur)}>Resultaat</th>
              </tr>
            </thead>
            <tbody>
              {data.elektrodes.map((e, i) => (
                <tr key={i} style={{ background: i % 2 === 1 ? '#F5F5F7' : '#ffffff' }}>
                  <td style={S.tdFirst}>{e.code}</td>
                  <td style={{ ...S.td, textAlign: 'center' }}>{e.eindtype}</td>
                  <td style={S.td}>{e.eindwaarde !== null ? `${fmt(e.eindwaarde)} Ω` : '—'}</td>
                  <td style={S.td}>{e.target_value !== null ? `≤ ${fmt(e.target_value)} Ω` : '—'}</td>
                  <td style={{ ...S.td, fontWeight: '700', color: e.rv_ok ? '#1B7A3A' : '#B71C1C' }}>
                    {e.rv_ok ? 'Voldoet' : 'Voldoet niet'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={S.conclusieCard(alleOk)}>
            <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.8px', color: '#AAAAAA', marginBottom: '8px' }}>
              CONCLUSIE & BEOORDELING
            </div>
            <div style={{ fontSize: '15px', fontWeight: '700', marginBottom: '8px' }}>
              {alleOk
                ? 'De gemeten waarden voldoen aan de opgegeven toetswaarde.'
                : 'Een of meer waarden voldoen niet aan de toetswaarde.'}
            </div>
            <div style={{ fontSize: '11px', color: '#DDDDDD', lineHeight: '1.6' }}>
              {alleOk
                ? `Op basis van de uitgevoerde metingen zijn geen afwijkingen vastgesteld ten opzichte van de ingestelde toetswaarde.`
                : `Op basis van de uitgevoerde metingen zijn afwijkingen vastgesteld. Zie de meetresultaten per elektrode voor details.`}
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              {data.elektrodes.map((e, i) => (
                <div key={i} style={{ flex: '1', padding: '12px', background: alleOk ? '#2C2C35' : '#8C1A1A', borderRadius: '8px' }}>
                  <div style={{ fontSize: '9px', color: '#AAAAAA', marginBottom: '4px' }}>{e.code}</div>
                  <div style={{ fontSize: '18px', fontWeight: '800' }}>{e.eindwaarde !== null ? `${fmt(e.eindwaarde)} Ω` : '—'}</div>
                  <div style={{ fontSize: '9px', color: '#AAAAAA', marginTop: '2px' }}>{e.eindtype} · {e.target_value !== null ? `≤ ${fmt(e.target_value)} Ω` : '—'}</div>
                  <div style={{ fontSize: '10px', fontWeight: '700', color: e.rv_ok ? '#ffffff' : '#FF9999', marginTop: '4px' }}>
                    {e.rv_ok ? 'Voldoet' : 'Voldoet niet'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {data.handtekening_b64 && (
            <div style={S.signBlock}>
              <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.6px', color: '#636366', fontWeight: '600', marginBottom: '12px' }}>
                Ondertekening
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                  <img
                    src={`data:image/png;base64,${data.handtekening_b64}`}
                    style={S.signImage}
                    alt="Handtekening"
                  />
                  <div style={{ borderTop: '1px solid #D2D2D7', paddingTop: '6px', marginTop: '8px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '600' }}>{data.monteur_naam_ondertekening}</div>
                    <div style={{ fontSize: '9px', color: '#636366' }}>Uitvoerend monteur</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '9px', color: '#636366' }}>Datum</div>
                  <div style={{ fontSize: '11px', fontWeight: '600' }}>{fmtDate(data.meetdatum)}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ ...S.footer, position: 'absolute' as const, bottom: '0', left: '0', right: '0' }}>
          <span>{data.bedrijf_naam} · {data.bedrijf_adres}</span>
          <span>Pagina {data.elektrodes.length + 2}</span>
        </div>
      </div>
    </div>
  );
}
