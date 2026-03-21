/**
 * Client-side PDF generator using jsPDF + jspdf-autotable.
 * Replicates the ReportLab "Clean B2B" rapport design.
 */
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { RapportData, Elektrode } from "@/hooks/useRapportGenerator";

// ── Colors ──
const BRAND_ORANGE = "#E8541A";
const NEAR_BLACK = "#1D1D1F";
const DARK = "#3A3A3C";
const MID = "#636366";
const LIGHT = "#AEAEB2";
const SEPARATOR = "#D2D2D7";
const BG = "#F5F5F7";
const PASS_GREEN = "#1B7A3A";
const PASS_BG = "#F0FAF3";
const FAIL_RED = "#B71C1C";
const FAIL_BG = "#FDF2F2";

const PAGE_W = 210; // A4 mm
const ML = 22;
const MR = 22;
const CW = PAGE_W - ML - MR;

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

// ── Header & Footer drawing ──
function drawHeader(
  doc: jsPDF,
  data: RapportData,
  brandColor: string,
  isFirstPage: boolean
) {
  const w = PAGE_W;
  const h = 297;

  // Top brand stripe
  doc.setFillColor(...hexToRgb(brandColor));
  doc.rect(0, 0, w * 0.55, 1.5, "F");
  doc.setFillColor(107, 45, 139); // purple
  doc.rect(w * 0.55, 0, w * 0.45, 1.5, "F");

  if (!isFirstPage) {
    // Company name top-left
    doc.setFontSize(7);
    doc.setTextColor(...hexToRgb(LIGHT));
    doc.text(
      `${data.project_naam}  ·  ${data.doc_nummer}`,
      w - MR,
      9,
      { align: "right" }
    );
    doc.text(`Pagina ${(doc as any).getCurrentPageInfo().pageNumber}`, w - MR, 13, {
      align: "right",
    });

    // Separator line
    doc.setDrawColor(...hexToRgb(SEPARATOR));
    doc.setLineWidth(0.1);
    doc.line(ML, 15.5, w - MR, 15.5);
  }
}

function drawFooter(doc: jsPDF, data: RapportData) {
  const w = PAGE_W;
  const y = 283;

  doc.setDrawColor(...hexToRgb(SEPARATOR));
  doc.setLineWidth(0.1);
  doc.line(ML, y, w - MR, y);

  doc.setFontSize(6.8);
  doc.setTextColor(...hexToRgb(LIGHT));
  doc.text(
    `${data.company_name || ""}  ·  ${data.company_address || ""}  ·  ${data.company_website || ""}  ·  ${data.company_email || ""}`,
    ML,
    y + 3.5
  );
  doc.text(
    `KvK ${data.kvk || ""}  ·  ${data.certificaten || ""}`,
    ML,
    y + 6.5
  );
  doc.text(
    `Doc. ${data.doc_nummer}  Rev. ${data.doc_revisie || "A"}`,
    w - MR,
    y + 3.5,
    { align: "right" }
  );
  doc.text("Vertrouwelijk", w - MR, y + 6.5, { align: "right" });
}

function addNewPage(doc: jsPDF, data: RapportData, brandColor: string) {
  doc.addPage();
  drawHeader(doc, data, brandColor, false);
  drawFooter(doc, data);
}

// ── Section title ──
function sectionTitle(doc: jsPDF, y: number, num: string, title: string, brandColor: string): number {
  doc.setFontSize(10.5);
  doc.setTextColor(...hexToRgb(brandColor));
  doc.setFont("helvetica", "bold");
  doc.text(num, ML, y);
  doc.setTextColor(...hexToRgb(NEAR_BLACK));
  doc.text(title, ML + 10, y);

  // underline
  doc.setDrawColor(...hexToRgb(SEPARATOR));
  doc.setLineWidth(0.2);
  doc.line(ML, y + 2, PAGE_W - MR, y + 2);

  return y + 6;
}

// ── Info list (two-column key-value) ──
function infoBlock(
  doc: jsPDF,
  y: number,
  rows: [string, string | undefined | null][]
): number {
  const filtered = rows.filter(([, v]) => v != null && String(v).trim() !== "");
  if (filtered.length === 0) return y;

  const colL = 48;
  const colR = CW - colL;

  for (const [label, value] of filtered) {
    if (y > 270) return y; // safety

    doc.setFontSize(7.5);
    doc.setTextColor(...hexToRgb(LIGHT));
    doc.setFont("helvetica", "normal");
    doc.text(label.toUpperCase(), ML, y);

    doc.setFontSize(9.5);
    doc.setTextColor(...hexToRgb(NEAR_BLACK));
    doc.text(String(value), ML + colL, y);

    // separator
    doc.setDrawColor(...hexToRgb(SEPARATOR));
    doc.setLineWidth(0.1);
    doc.line(ML, y + 2, PAGE_W - MR, y + 2);

    y += 7;
  }
  return y;
}

// ── Compact info block (two-column side by side for cover) ──
function coverInfoBlock(
  doc: jsPDF,
  y: number,
  title: string,
  rows: [string, string | undefined | null][],
  brandColor: string
): number {
  const filtered = rows.filter(([, v]) => v != null && String(v).trim() !== "");
  if (filtered.length === 0) return y;

  // Title
  doc.setFontSize(8.5);
  doc.setTextColor(...hexToRgb(brandColor));
  doc.setFont("helvetica", "bold");
  doc.text(title.toUpperCase(), ML, y);
  y += 4;

  // Split into two columns
  const half = Math.ceil(filtered.length / 2);
  const left = filtered.slice(0, half);
  const right = filtered.slice(half);
  const colW = CW / 2 - 3;

  const startY = y;
  let maxY = y;

  // Left column
  let ly = startY;
  for (const [label, value] of left) {
    doc.setFontSize(7.5);
    doc.setTextColor(...hexToRgb(LIGHT));
    doc.setFont("helvetica", "normal");
    doc.text(label.toUpperCase(), ML, ly);
    doc.setFontSize(8.5);
    doc.setTextColor(...hexToRgb(NEAR_BLACK));
    doc.setFont("helvetica", "bold");
    doc.text(String(value), ML, ly + 3.5);
    doc.setDrawColor(...hexToRgb(SEPARATOR));
    doc.setLineWidth(0.1);
    doc.line(ML, ly + 5.5, ML + colW, ly + 5.5);
    ly += 9;
  }
  maxY = Math.max(maxY, ly);

  // Right column
  let ry = startY;
  const rx = ML + colW + 6;
  for (const [label, value] of right) {
    doc.setFontSize(7.5);
    doc.setTextColor(...hexToRgb(LIGHT));
    doc.setFont("helvetica", "normal");
    doc.text(label.toUpperCase(), rx, ry);
    doc.setFontSize(8.5);
    doc.setTextColor(...hexToRgb(NEAR_BLACK));
    doc.setFont("helvetica", "bold");
    doc.text(String(value), rx, ry + 3.5);
    doc.setDrawColor(...hexToRgb(SEPARATOR));
    doc.setLineWidth(0.1);
    doc.line(rx, ry + 5.5, rx + colW, ry + 5.5);
    ry += 9;
  }
  maxY = Math.max(maxY, ry);

  return maxY;
}

// ── Electrode header (RA/RV result box) ──
function elektrodeKop(
  doc: jsPDF,
  y: number,
  e: Elektrode,
  toetswaarde: string,
  gebruikRv: boolean
): number {
  const ok = e.rv_ok;
  const kleur = ok ? PASS_GREEN : FAIL_RED;
  const bg = ok ? PASS_BG : FAIL_BG;
  const waarde = e.rv;
  const label = gebruikRv
    ? "AARDVERSPREIDINGSWEERSTAND (RV)"
    : "AARDINGSWEERSTAND (RA)";
  const status = ok ? "Voldoet aan toetswaarde" : "Voldoet niet aan toetswaarde";

  // Background
  doc.setFillColor(...hexToRgb(bg));
  doc.rect(ML, y, CW, 18, "F");

  // Left accent border
  doc.setFillColor(...hexToRgb(kleur));
  doc.rect(ML, y, 1, 18, "F");

  // RA/RV label + value
  doc.setFontSize(7.5);
  doc.setTextColor(...hexToRgb(LIGHT));
  doc.setFont("helvetica", "normal");
  doc.text(label, ML + 5, y + 5);

  doc.setFontSize(18);
  doc.setTextColor(...hexToRgb(kleur));
  doc.setFont("helvetica", "bold");
  doc.text(waarde, ML + 5, y + 13);

  // Toetswaarde
  const midX = ML + CW * 0.42;
  doc.setFontSize(7.5);
  doc.setTextColor(...hexToRgb(LIGHT));
  doc.setFont("helvetica", "normal");
  doc.text("TOETSWAARDE", midX, y + 5);
  doc.setFontSize(9.5);
  doc.setTextColor(...hexToRgb(NEAR_BLACK));
  doc.setFont("helvetica", "bold");
  doc.text(`≤ ${toetswaarde}`, midX, y + 11);

  // Resultaat
  const rX = ML + CW * 0.7;
  doc.setFontSize(7.5);
  doc.setTextColor(...hexToRgb(LIGHT));
  doc.setFont("helvetica", "normal");
  doc.text("RESULTAAT", rX, y + 5);
  doc.setFontSize(10);
  doc.setTextColor(...hexToRgb(kleur));
  doc.setFont("helvetica", "bold");
  doc.text(status, rX, y + 11);

  // Outer border
  doc.setDrawColor(...hexToRgb(SEPARATOR));
  doc.setLineWidth(0.1);
  doc.rect(ML, y, CW, 18);

  return y + 22;
}

// ── Measurement table using autoTable ──
function metingTabel(
  doc: jsPDF,
  y: number,
  e: Elektrode
): number {
  // Filter to only filled rows
  const gevuld = e.metingen.filter((m) =>
    m.waarden.some((w) => w !== null)
  );
  if (gevuld.length === 0) return y;

  // Find minimum value for highlighting
  const alleVals = gevuld.flatMap((m) =>
    m.waarden.filter((w): w is number => w !== null)
  );
  const minVal = alleVals.length > 0 ? Math.min(...alleVals) : null;

  const headers = ["Diepte (m)", ...e.pen_labels];
  const body = gevuld.map((m) => {
    const depthStr =
      m.diepte === Math.floor(m.diepte)
        ? String(m.diepte)
        : String(m.diepte);
    return [
      depthStr,
      ...m.waarden.map((w) => (w !== null ? w.toFixed(2) : "—")),
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [headers],
    body,
    margin: { left: ML, right: MR },
    theme: "plain",
    styles: {
      fontSize: 9,
      cellPadding: { top: 2, bottom: 2, left: 3, right: 3 },
      textColor: hexToRgb(DARK),
      lineColor: hexToRgb(SEPARATOR),
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: hexToRgb(NEAR_BLACK),
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 7.5,
      halign: "center",
    },
    columnStyles: {
      0: { halign: "left", fontStyle: "bold", textColor: hexToRgb(NEAR_BLACK) },
    },
    alternateRowStyles: {
      fillColor: hexToRgb(BG),
    },
    didParseCell(data) {
      // Highlight minimum value in green
      if (data.section === "body" && data.column.index > 0) {
        const cellVal = parseFloat(data.cell.raw as string);
        if (!isNaN(cellVal) && minVal !== null && Math.abs(cellVal - minVal) < 0.001) {
          data.cell.styles.textColor = hexToRgb(PASS_GREEN);
          data.cell.styles.fontStyle = "bold";
        }
        data.cell.styles.halign = "right";
      }
    },
  });

  return (doc as any).lastAutoTable.finalY + 3;
}

// ── Conclusie card ──
function conclusieKaart(
  doc: jsPDF,
  y: number,
  data: RapportData,
  alleOk: boolean,
  brandColor: string
): number {
  const ANTRACIET = "#23232A";
  const DIEP_ROOD = "#7A1212";
  const WIT = "#FFFFFF";
  const WIT_DIM = "#AAAAAA";

  const kaartBg = alleOk ? ANTRACIET : DIEP_ROOD;
  const accent = alleOk ? brandColor : "#DD4444";
  const toetswaarde = data.toetswaarde || "3,00 Ω";

  const titel = alleOk
    ? "De gemeten waarden voldoen aan de opgegeven toetswaarde."
    : "Een of meer meetwaarden voldoen niet aan de toetswaarde.";
  const body = alleOk
    ? `Op basis van de uitgevoerde metingen zijn geen afwijkingen vastgesteld ten opzichte van de ingestelde toetswaarde (≤ ${toetswaarde}).`
    : `Op basis van de uitgevoerde metingen zijn afwijkingen vastgesteld ten opzichte van de ingestelde toetswaarde (≤ ${toetswaarde}). Zie de meetresultaten per elektrode voor details.`;

  const cardH = 50 + data.elektrodes.length * 2;

  // Background
  doc.setFillColor(...hexToRgb(kaartBg));
  doc.rect(ML, y, CW, cardH, "F");

  // Left accent
  doc.setFillColor(...hexToRgb(accent));
  doc.rect(ML, y, 1.2, cardH, "F");

  // Label
  doc.setFontSize(7.5);
  doc.setTextColor(...hexToRgb(WIT_DIM));
  doc.setFont("helvetica", "normal");
  doc.text("CONCLUSIE & BEOORDELING", ML + 6, y + 7);

  // Title
  doc.setFontSize(11);
  doc.setTextColor(...hexToRgb(WIT));
  doc.setFont("helvetica", "bold");
  doc.text(titel, ML + 6, y + 14, { maxWidth: CW - 12 });

  // Body text
  doc.setFontSize(9);
  doc.setTextColor(...hexToRgb("#DDDDDD"));
  doc.setFont("helvetica", "normal");
  const bodyLines = doc.splitTextToSize(body, CW - 12);
  doc.text(bodyLines, ML + 6, y + 22);

  // Electrode mini blocks
  const celY = y + 22 + bodyLines.length * 4 + 4;
  const celW = (CW - 12) / data.elektrodes.length;
  const celBg = alleOk ? "#2C2C35" : "#8C1A1A";
  const gebruikRv = data.gebruik_rv !== false;

  data.elektrodes.forEach((e, i) => {
    const cx = ML + 6 + i * celW;
    doc.setFillColor(...hexToRgb(celBg));
    doc.rect(cx, celY, celW - 2, 22, "F");

    doc.setFontSize(7.5);
    doc.setTextColor(...hexToRgb(WIT_DIM));
    doc.setFont("helvetica", "normal");
    doc.text(`Elektrode ${e.nummer}`, cx + 4, celY + 5);

    doc.setFontSize(14);
    doc.setTextColor(...hexToRgb(WIT));
    doc.setFont("helvetica", "bold");
    doc.text(e.rv, cx + 4, celY + 12);

    doc.setFontSize(7.5);
    doc.setTextColor(...hexToRgb(WIT_DIM));
    doc.setFont("helvetica", "normal");
    doc.text(`${gebruikRv ? "RV" : "RA"}  ·  ≤ ${data.toetswaarde || "3,00 Ω"}`, cx + 4, celY + 16);

    const resKleur = e.rv_ok ? WIT : "#FF9999";
    doc.setFontSize(8.5);
    doc.setTextColor(...hexToRgb(resKleur));
    doc.setFont("helvetica", "bold");
    doc.text(e.rv_ok ? "Voldoet" : "Voldoet niet", cx + 4, celY + 20);
  });

  return celY + 28;
}

// ══════════════════════════════════════════
// MAIN BUILDER
// ══════════════════════════════════════════

export function generateRapportPdf(data: RapportData): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const brandColor = data.brand_color_hex || BRAND_ORANGE;
  const toetswaarde = data.toetswaarde || "3,00 Ω";
  const gebruikRv = data.gebruik_rv !== false;
  const alleOk = data.elektrodes.every((e) => e.rv_ok);

  // ══════════════════════════════════════
  // PAGE 1: COVER
  // ══════════════════════════════════════
  drawHeader(doc, data, brandColor, true);
  drawFooter(doc, data);

  let y = 20;

  // Title
  doc.setFontSize(27);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...hexToRgb(NEAR_BLACK));
  doc.text("Aardingsmeting", ML, y);
  y += 10;
  doc.setTextColor(...hexToRgb(brandColor));
  doc.text("Rapport", ML, y);
  y += 4;

  // Brand line
  doc.setDrawColor(...hexToRgb(brandColor));
  doc.setLineWidth(0.8);
  doc.line(ML, y, ML + CW * 0.25, y);
  y += 8;

  // Project identity
  doc.setFontSize(13);
  doc.setTextColor(...hexToRgb(NEAR_BLACK));
  doc.setFont("helvetica", "bold");
  doc.text(data.project_naam, ML, y);
  y += 4;
  doc.setFontSize(9.5);
  doc.setTextColor(...hexToRgb(MID));
  doc.setFont("helvetica", "normal");
  doc.text(data.project_adres, ML, y);
  y += 10;

  // Separator
  doc.setDrawColor(...hexToRgb(SEPARATOR));
  doc.setLineWidth(0.1);
  doc.line(ML, y, PAGE_W - MR, y);
  y += 5;

  // Project info block
  y = coverInfoBlock(doc, y, "Projectgegevens", [
    ["Projectnummer", data.project_nr],
    ["Opdrachtgever", data.opdrachtgever_bedrijf],
    ["Contactpersoon", data.opdrachtgever_contact],
    ["Datum uitvoering", data.meetdatum],
    ["Monteur", data.monteur],
    ["Toetswaarde", `≤ ${toetswaarde}`],
  ], brandColor);

  y += 4;
  doc.line(ML, y, PAGE_W - MR, y);
  y += 5;

  // Equipment info block
  y = coverInfoBlock(doc, y, "Meetapparatuur", [
    ["Merk & type", data.apparaat_naam],
    ["Serienummer", data.apparaat_serie],
    ["Meetmethode", data.meetmethode],
    ["Kalibratiedatum", data.kalibratie_datum],
    ["Volgende kalibratie", data.kalibratie_volgende],
  ], brandColor);

  y += 8;

  // Status box
  const okKleur = alleOk ? PASS_GREEN : FAIL_RED;
  const okBg = alleOk ? PASS_BG : FAIL_BG;
  const statusTekst = alleOk
    ? "✓  De gemeten waarden voldoen aan de opgegeven toetswaarde."
    : "✗  Een of meer meetwaarden voldoen niet aan de opgegeven toetswaarde.";

  doc.setFillColor(...hexToRgb(okBg));
  doc.rect(ML, y, CW, 12, "F");
  doc.setFillColor(...hexToRgb(okKleur));
  doc.rect(ML, y, 1, 12, "F");
  doc.setDrawColor(...hexToRgb(SEPARATOR));
  doc.rect(ML, y, CW, 12);

  doc.setFontSize(10);
  doc.setTextColor(...hexToRgb(okKleur));
  doc.setFont("helvetica", "bold");
  doc.text(statusTekst, ML + 5, y + 7.5);

  // ══════════════════════════════════════
  // PAGES 2+: ELECTRODE RESULTS
  // ══════════════════════════════════════
  for (const e of data.elektrodes) {
    addNewPage(doc, data, brandColor);
    y = 22;

    y = sectionTitle(doc, y, `${e.nummer}.`, `Meetresultaten — Elektrode ${e.nummer}`, brandColor);
    y += 2;

    y = elektrodeKop(doc, y, e, toetswaarde, gebruikRv);
    y += 2;

    // Subtitle
    doc.setFontSize(8.5);
    doc.setTextColor(...hexToRgb(DARK));
    doc.setFont("helvetica", "bold");
    doc.text("Meetwaarden per diepte", ML, y);
    y += 4;

    y = metingTabel(doc, y, e);

    // Footnote
    doc.setFontSize(7.5);
    doc.setTextColor(...hexToRgb(LIGHT));
    doc.setFont("helvetica", "normal");
    doc.text(
      `Meetmethode: ${data.meetmethode || "3-punts"}  ·  Maatgevende waarde: laagste gemeten ${gebruikRv ? "RV" : "RA"}  ·  Toetswaarde: ≤ ${toetswaarde}`,
      ML,
      y + 2
    );
  }

  // ══════════════════════════════════════
  // LAST PAGE: SUMMARY + CONCLUSION + SIGNATURE
  // ══════════════════════════════════════
  addNewPage(doc, data, brandColor);
  y = 22;

  const secNum = data.elektrodes.length + 1;
  y = sectionTitle(doc, y, `${secNum}.`, "Samenvatting & Conclusie", brandColor);
  y += 4;

  // Summary table
  const summaryHeaders = [
    "Elektrode",
    gebruikRv ? "RV (Ω)" : "RA (Ω)",
    "Toetswaarde",
    "Resultaat",
  ];
  const summaryBody = data.elektrodes.map((e) => [
    `Elektrode ${e.nummer}`,
    e.rv,
    `≤ ${toetswaarde}`,
    e.rv_ok ? "Voldoet" : "Voldoet niet",
  ]);

  autoTable(doc, {
    startY: y,
    head: [summaryHeaders],
    body: summaryBody,
    margin: { left: ML, right: MR },
    theme: "plain",
    styles: {
      fontSize: 9,
      cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 },
      textColor: hexToRgb(DARK),
      lineColor: hexToRgb(SEPARATOR),
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: hexToRgb(NEAR_BLACK),
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 7.5,
    },
    alternateRowStyles: {
      fillColor: hexToRgb(BG),
    },
    didParseCell(cellData) {
      if (cellData.section === "body" && cellData.column.index === 3) {
        const ok = cellData.cell.raw === "Voldoet";
        cellData.cell.styles.textColor = hexToRgb(ok ? PASS_GREEN : FAIL_RED);
        cellData.cell.styles.fontStyle = "bold";
        cellData.cell.styles.halign = "center";
      }
    },
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  // Conclusion card
  y = conclusieKaart(doc, y, data, alleOk, brandColor);
  y += 8;

  // ── Signature block ──
  const sigSecNum = secNum + 1;
  y = sectionTitle(doc, y, `${sigSecNum}.`, "Verklaring en Ondertekening", brandColor);
  y += 4;

  doc.setFontSize(9.5);
  doc.setTextColor(...hexToRgb(MID));
  doc.setFont("helvetica", "normal");
  const declText = `Ondergetekende verklaart dat de in dit rapport vermelde metingen zijn uitgevoerd met gekalibreerde meetapparatuur (serienummer ${data.apparaat_serie}, kalibratiedatum ${data.kalibratie_datum}). De meetresultaten zijn nauwkeurig en volledig weergegeven.`;
  const declLines = doc.splitTextToSize(declText, CW);
  doc.text(declLines, ML, y);
  y += declLines.length * 4 + 10;

  // Signature fields
  const sigItems = [
    ["NAAM MONTEUR", data.monteur],
    ["HANDTEKENING", ""],
    ["DATUM", data.meetdatum],
  ];
  const sigW = CW / 3;

  sigItems.forEach(([label, value], i) => {
    const sx = ML + i * sigW;
    doc.setFontSize(7);
    doc.setTextColor(...hexToRgb(LIGHT));
    doc.setFont("helvetica", "normal");
    doc.text(label, sx, y);

    doc.setDrawColor(...hexToRgb(SEPARATOR));
    doc.setLineWidth(0.15);
    doc.line(sx, y + 10, sx + 42, y + 10);

    doc.setFontSize(9);
    doc.setTextColor(...hexToRgb(NEAR_BLACK));
    doc.setFont("helvetica", "bold");
    doc.text(value, sx, y + 14);
  });

  return doc;
}
