/**
 * useHandtekening.ts
 * Beheert de opgeslagen handtekening van de monteur.
 *
 * Opslag: localStorage per monteur-ID
 * - Handtekening wordt als base64 PNG opgeslagen
 * - Persistent tussen sessies
 * - Per monteur gescheiden (als je multi-user hebt)
 */

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY_PREFIX = "aardpen_handtekening_";

interface UseHandtekeningResult {
  /** Opgeslagen handtekening als base64 PNG, of null als niet aanwezig */
  opgeslagenHandtekening: string | null;
  /** Sla een nieuwe handtekening op */
  slaHandtekeningOp: (base64: string) => Promise<void>;
  /** Verwijder de opgeslagen handtekening */
  verwijderHandtekening: () => void;
  /** True tijdens opslaan */
  isLoading: boolean;
  /** True als er een opgeslagen handtekening is */
  heeftOpgeslagen: boolean;
}

/**
 * @param monteurId - unieke ID van de monteur (uit je auth systeem)
 *                   Als niet opgegeven wordt "default" gebruikt
 */
export function useHandtekening(monteurId?: string): UseHandtekeningResult {
  const sleutel = `${STORAGE_KEY_PREFIX}${monteurId ?? "default"}`;

  const [opgeslagenHandtekening, setOpgeslagenHandtekening] =
    useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Laad bij initialisatie
  useEffect(() => {
    try {
      const opgeslagen = localStorage.getItem(sleutel);
      if (opgeslagen) {
        setOpgeslagenHandtekening(opgeslagen);
      }
    } catch {
      // localStorage niet beschikbaar (bv. incognito met strenge instellingen)
      console.warn("Handtekening opslag niet beschikbaar");
    }
  }, [sleutel]);

  const slaHandtekeningOp = useCallback(
    async (base64: string): Promise<void> => {
      setIsLoading(true);
      try {
        // Kleine vertraging voor UX feedback
        await new Promise(resolve => setTimeout(resolve, 300));
        localStorage.setItem(sleutel, base64);
        setOpgeslagenHandtekening(base64);
      } catch {
        console.error("Kon handtekening niet opslaan");
        throw new Error("Handtekening opslaan mislukt");
      } finally {
        setIsLoading(false);
      }
    },
    [sleutel]
  );

  const verwijderHandtekening = useCallback(() => {
    try {
      localStorage.removeItem(sleutel);
      setOpgeslagenHandtekening(null);
    } catch {
      console.error("Kon handtekening niet verwijderen");
    }
  }, [sleutel]);

  return {
    opgeslagenHandtekening,
    slaHandtekeningOp,
    verwijderHandtekening,
    isLoading,
    heeftOpgeslagen: opgeslagenHandtekening !== null,
  };
}
