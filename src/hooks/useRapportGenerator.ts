/**
 * useRapportGenerator.ts — v2
 * RA/RV logica correct verwerkt:
 * - 1 pen               → RA automatisch
 * - 2+ gekoppelde pennen → RV automatisch
 * - Nooit beide tegelijk per elektrode
 * - Geen globale gebruik_rv vlag meer
 */

import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { generateRapportPdf } from "@/lib/rapport-pdf-generator";

// ══════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════

export type EindType = "RA" | "RV";

export interface Meting {
  diepte: number;
  waarden: (number | null)[];
}

export interface Elektrode {
  nummer: number;
  ra?: string;                  // alleen invullen als 1 pen
  rv?: string;                  // alleen invullen als 2+ gekoppelde pennen
  norm: string;
  rv_ok: boolean;
  pen_labels: string[];
  pennen_gekoppeld?: boolean;
  metingen: Meting[];
  foto_display_b64?: string;
  foto_overzicht_b64?: string;
  foto_display_url?: string;
  foto_overzicht_url?: string;
}

export interface RapportData {
  company_name?: string;
  company_address?: string;
  company_email?: string;
  company_website?: string;
  kvk?: string;
  certificaten?: string;
  brand_color_hex?: string;
  doc_nummer: string;
  doc_revisie?: string;
  project_nr: string;
  project_naam: string;
  project_adres: string;
  meetdatum: string;
  toetswaarde?: string;
  opdrachtgever_bedrijf: string;
  opdrachtgever_contact?: string;
  behuizingsnummer?: string;
  leidingmateriaal?: string;
  monteur: string;
  apparaat_naam: string;
  apparaat_serie: string;
  meetmethode?: string;
  kalibratie_datum: string;
  kalibratie_volgende?: string;
  kalibratie_instituut?: string;
  situatieschets_b64?: string;
  handtekening_b64?: string;
  elektrodes: Elektrode[];
}

// ══════════════════════════════════════════
// RA/RV BUSINESSLOGICA
// ══════════════════════════════════════════

export function leidEindTypeAf(elektrode: Elektrode): EindType {
  const aantalPennen = elektrode.pen_labels.length;
  const gekoppeld = elektrode.pennen_gekoppeld ?? (aantalPennen >= 2);
  if (aantalPennen >= 2 && gekoppeld) return "RV";
  return "RA";
}

export function getEindwaarde(elektrode: Elektrode): string {
  const type = leidEindTypeAf(elektrode);
  if (type === "RV") return elektrode.rv ?? "—";
  return elektrode.ra ?? elektrode.rv ?? "—";
}

export interface ValidatieFout {
  elektrodeNummer: number;
  fout: string;
}

export function valideerRaRvLogica(elektrodes: Elektrode[]): ValidatieFout[] {
  const fouten: ValidatieFout[] = [];

  for (const e of elektrodes) {
    const nr = e.nummer;
    const type = leidEindTypeAf(e);

    if (e.ra && e.rv) {
      fouten.push({
        elektrodeNummer: nr,
        fout: `Elektrode ${nr}: ra én rv zijn beide ingevuld — vul slechts één in.`,
      });
    }
    if (type === "RV" && !e.rv) {
      fouten.push({
        elektrodeNummer: nr,
        fout: `Elektrode ${nr}: 2+ gekoppelde pennen maar geen rv-waarde ingevuld.`,
      });
    }
    if (type === "RA" && !e.ra && !e.rv) {
      fouten.push({
        elektrodeNummer: nr,
        fout: `Elektrode ${nr}: geen ra-waarde ingevuld.`,
      });
    }
    const heeftWaarden = e.metingen.some((m) => m.waarden.some((w) => w !== null));
    if (!heeftWaarden) {
      fouten.push({
        elektrodeNummer: nr,
        fout: `Elektrode ${nr}: geen ingevulde meetwaarden.`,
      });
    }
  }
  return fouten;
}

// ══════════════════════════════════════════
// HOOK
// ══════════════════════════════════════════

export function useRapportGenerator() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Genereer PDF client-side. Data wordt opgehaald via de edge function,
   * maar de PDF wordt lokaal gebouwd met jsPDF.
   */
  const genereerViaEdge = useCallback(async (projectId: string, handtekeningB64?: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("generate-rapport", {
        body: { project_id: projectId },
      });

      if (fnError) throw new Error(fnError.message);

      // If the edge function returned a PDF (external API configured), use it
      if (data?.pdf_base64) {
        downloadBase64Pdf(data.pdf_base64, data.bestandsnaam || `Aardingsrapport_${projectId}.pdf`);
        return;
      }

      // Otherwise, use prepared_data to generate PDF client-side
      const rapportData: RapportData = data?.prepared_data || data;
      if (!rapportData?.project_naam) {
        throw new Error("Geen rapportdata ontvangen");
      }

      // Attach signature if provided
      if (handtekeningB64) {
        rapportData.handtekening_b64 = handtekeningB64;
      }

      // Fetch photo URLs and convert to base64 for PDF embedding
      await laadFotosVoorElektrodes(rapportData.elektrodes);

      const doc = generateRapportPdf(rapportData);
      const projectClean = rapportData.project_naam.replace(/\s+/g, "_").slice(0, 30);
      const datumClean = rapportData.meetdatum.replace(/-/g, "").replace(/\s/g, "").slice(0, 8);
      const bestandsnaam = `Aardingsrapport_${projectClean}_${datumClean}.pdf`;

      doc.save(bestandsnaam);
    } catch (err) {
      const bericht = err instanceof Error ? err.message : "Onbekende fout";
      setError(bericht);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { genereerViaEdge, isLoading, error };
}

// ══════════════════════════════════════════
// HULPFUNCTIES
// ══════════════════════════════════════════

function downloadBase64Pdf(b64: string, filename: string) {
  const byteChars = atob(b64);
  const byteNumbers = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) {
    byteNumbers[i] = byteChars.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Fetch een afbeelding-URL en retourneer als data-URL (base64).
 * Geeft null terug bij fouten.
 */
async function urlNaarDataUrl(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/**
 * Laad foto URLs en converteer naar base64 data-URLs voor jsPDF.
 * Muteert de elektrode objecten in-place.
 */
async function laadFotosVoorElektrodes(elektrodes: Elektrode[]): Promise<void> {
  const taken: Promise<void>[] = [];

  for (const e of elektrodes) {
    if (e.foto_display_url && !e.foto_display_b64) {
      taken.push(
        urlNaarDataUrl(e.foto_display_url).then((dataUrl) => {
          if (dataUrl) e.foto_display_b64 = dataUrl;
        })
      );
    }
    if (e.foto_overzicht_url && !e.foto_overzicht_b64) {
      taken.push(
        urlNaarDataUrl(e.foto_overzicht_url).then((dataUrl) => {
          if (dataUrl) e.foto_overzicht_b64 = dataUrl;
        })
      );
    }
  }

  await Promise.all(taken);
}

export function fotoNaarBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve((r.result as string).split(",")[1]);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export function genereerDocNummer(projectNr: string): string {
  return `RPT-${new Date().getFullYear()}-${projectNr.replace(/\D/g, "").padStart(5, "0")}`;
}
