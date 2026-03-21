/**
 * useRapportGenerator.ts
 * React hook — roept de generate-rapport edge function aan
 * en triggert een PDF download in de browser.
 *
 * Gebruik:
 *   const { genereer, isLoading, error } = useRapportGenerator()
 *   await genereer(projectId)
 */

import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

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

  elektrodes: Elektrode[];
}

// ── Hook ──────────────────────────────────────────────

export function useRapportGenerator() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Genereer PDF via edge function (verzamelt data automatisch).
   */
  const genereerViaEdge = useCallback(async (projectId: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-rapport', {
        body: { project_id: projectId },
      });

      if (fnError) throw new Error(fnError.message);

      if (data?.pdf_base64) {
        // Base64 PDF → download
        const byteChars = atob(data.pdf_base64);
        const byteNumbers = new Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) {
          byteNumbers[i] = byteChars.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = data.bestandsnaam || `Aardingsrapport_${projectId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        throw new Error("Geen PDF ontvangen van de server");
      }
    } catch (err) {
      const bericht = err instanceof Error ? err.message : "Onbekende fout";
      setError(bericht);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Genereer PDF via directe externe API call met handmatige data.
   */
  const genereerDirect = useCallback(async (data: RapportData, apiUrl: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiUrl}/rapport/genereer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const detail = await response.json().catch(() => ({}));
        throw new Error(detail?.detail ?? `API fout: ${response.status}`);
      }

      const disposition = response.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="([^"]+)"/);
      const bestandsnaam = match?.[1] ?? `Aardingsrapport_${data.project_nr}.pdf`;

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = bestandsnaam;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      const bericht = err instanceof Error ? err.message : "Onbekende fout";
      setError(bericht);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { genereerViaEdge, genereerDirect, isLoading, error };
}


// ── Hulpfunctie: afbeelding → base64 ──────────────────

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


// ── Hulpfunctie: documentnummer genereren ──────────────

export function genereerDocNummer(projectNr: string): string {
  const jaar = new Date().getFullYear();
  const nr = projectNr.replace(/\D/g, "").padStart(5, "0");
  return `RPT-${jaar}-${nr}`;
}
