/**
 * useRapportGenerator.ts
 * React hook — genereert PDF client-side met jsPDF.
 * Fallback via edge function als RAPPORT_API_URL is geconfigureerd.
 */

import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { generateRapportPdf } from "@/lib/rapport-pdf-generator";

// ── Types ──────────────────────────────────────────────

export interface Meting {
  diepte: number;
  waarden: (number | null)[];
}

export interface Elektrode {
  nummer: number;
  rv: string;
  norm: string;
  rv_ok: boolean;
  pen_labels: string[];
  metingen: Meting[];
  foto_display_b64?: string;
  foto_overzicht_b64?: string;
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
  gebruik_rv?: boolean;

  opdrachtgever_bedrijf: string;
  opdrachtgever_contact?: string;

  monteur: string;

  apparaat_naam: string;
  apparaat_serie: string;
  meetmethode?: string;
  kalibratie_datum: string;
  kalibratie_volgende?: string;

  elektrodes: Elektrode[];
}

// ── Hook ──────────────────────────────────────────────

export function useRapportGenerator() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Genereer PDF client-side. Data wordt opgehaald via de edge function,
   * maar de PDF wordt lokaal gebouwd met jsPDF.
   */
  const genereerViaEdge = useCallback(async (projectId: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      // Call edge function to gather data
      const { data, error: fnError } = await supabase.functions.invoke('generate-rapport', {
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

// ── Helpers ──

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

export function fotoNaarBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function genereerDocNummer(projectNr: string): string {
  const jaar = new Date().getFullYear();
  const nr = projectNr.replace(/\D/g, "").padStart(5, "0");
  return `RPT-${jaar}-${nr}`;
}
