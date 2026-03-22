/**
 * BROWSER PDF GENERATOR
 * Voordelen: geen externe API nodig,
 *   werkt offline, foto's direct via URL
 * Beperkingen:
 *   - Paginaopmaak minder precies
 *     dan Python/ReportLab
 *   - Grote rapporten (10+ elektrodes)
 *     kunnen even duren (~5-10 seconden)
 *   - html2canvas werkt niet met
 *     SVG background images
 *   - Requires useCORS voor foto's
 */

import { useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { RapportTemplate } from '@/components/rapport/RapportTemplate';
import type { RapportData } from '@/components/rapport/RapportTemplate';
import { useToast } from '@/hooks/use-toast';

export function useRapportGeneratorBrowser() {
  const [bezig, setBezig] = useState(false);
  const { toast } = useToast();

  const genereer = useCallback(async (
    data: RapportData,
    bestandsnaam: string
  ) => {
    setBezig(true);
    try {
      // 1. Create hidden container
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.width = '794px';
      container.style.background = 'white';
      container.style.zIndex = '-1';
      document.body.appendChild(container);

      // 2. Render React component
      const root = createRoot(container);
      await new Promise<void>((resolve) => {
        root.render(
          <RapportTemplate data={data} onReady={resolve} />
        );
      });

      // 3. Wait for images to load
      await new Promise(r => setTimeout(r, 600));

      // 4. Zoek alle logische pagina's
      const pageElements = container.querySelectorAll('[data-pdf-page]');

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: 'a4',
        hotfixes: ['px_scaling'],
      });

      const pdfBreedte = pdf.internal.pageSize.getWidth();
      const pdfHoogte = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < pageElements.length; i++) {
        if (i > 0) pdf.addPage();

        const pageEl = pageElements[i] as HTMLElement;

        const canvas = await html2canvas(pageEl, {
          scale: 2,
          useCORS: true,
          allowTaint: false,
          backgroundColor: '#ffffff',
          width: 794,
          windowWidth: 794,
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const imgHoogte = (canvas.height / canvas.width) * pdfBreedte;

        pdf.addImage(
          imgData, 'JPEG',
          0, 0,
          pdfBreedte,
          Math.min(imgHoogte, pdfHoogte)
        );
      }

      // 6. Download
      pdf.save(bestandsnaam);

      // 7. Cleanup
      root.unmount();
      document.body.removeChild(container);

      toast({
        title: 'Rapport gegenereerd',
        description: bestandsnaam,
      });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'PDF genereren mislukt',
        description: err.message || 'Probeer opnieuw.',
      });
      throw err;
    } finally {
      setBezig(false);
    }
  }, [toast]);

  return { genereer, bezig };
}
