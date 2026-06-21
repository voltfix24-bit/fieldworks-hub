import { useMemo } from 'react';
import { useProject } from './use-projects';
import { useReportData } from './use-report-data';

export type ReadinessFix = 'measurements' | 'project' | 'equipment';

export interface ReadinessIssue {
  code: string;
  label: string;
  fix?: ReadinessFix;
}

export interface ReportReadiness {
  blockers: ReadinessIssue[]; // altijd leeg — niets blokkeert rapportgeneratie
  warnings: ReadinessIssue[];
  isReady: boolean;
  hasWarnings: boolean;
  isLoading: boolean;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function toDate(value?: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Rapportage is altijd mogelijk. Niets blokkeert.
 * Alle ontbrekende velden worden als warnings getoond, zodat de monteur
 * weet wat nog ingevuld kan worden — maar het rapport opent altijd.
 */
export function useReportReadiness(projectId?: string): ReportReadiness {
  const { data: project, isLoading: projectLoading } = useProject(projectId);
  const { data: reportData, isLoading: reportLoading } = useReportData(projectId);

  return useMemo<ReportReadiness>(() => {
    const blockers: ReadinessIssue[] = [];
    const warnings: ReadinessIssue[] = [];

    const isLoading = projectLoading || reportLoading || !project;
    if (isLoading) {
      return { blockers, warnings, isReady: false, hasWarnings: false, isLoading: true };
    }

    const client = (project as any).clients || null;
    const tech = (project as any).technicians || null;
    const equip = (project as any).equipment || null;
    const session = reportData?.session || null;
    const electrodes = reportData?.electrodes || [];
    const attachments = reportData?.attachments || [];

    const measurementDate = toDate(session?.measurement_date);

    // Hoofdgegevens (warnings, niet blokkerend)
    if (!measurementDate) {
      warnings.push({ code: 'no_measurement_date', label: 'Meetdatum ontbreekt', fix: 'measurements' });
    }
    if (!client) {
      warnings.push({ code: 'no_client', label: 'Klant ontbreekt', fix: 'project' });
    }
    if (!tech) {
      warnings.push({ code: 'no_technician', label: 'Monteur ontbreekt', fix: 'project' });
    }
    if (!equip) {
      warnings.push({ code: 'no_equipment', label: 'Meetapparatuur ontbreekt', fix: 'project' });
    }

    // Apparatuur details (warnings)
    if (equip) {
      if (!equip.serial_number || String(equip.serial_number).trim() === '') {
        warnings.push({ code: 'no_serial', label: 'Serienummer apparatuur ontbreekt', fix: 'equipment' });
      }
      const calDate = toDate(equip.calibration_date);
      const nextCal = toDate(equip.next_calibration_date);
      if (!calDate || !nextCal) {
        warnings.push({ code: 'no_calibration', label: 'Kalibratiedatum apparatuur ontbreekt', fix: 'equipment' });
      } else if (measurementDate && nextCal.getTime() < measurementDate.getTime()) {
        warnings.push({
          code: 'calibration_expired',
          label: 'Kalibratie verlopen op meetdatum',
          fix: 'equipment',
        });
      } else if (nextCal) {
        const ref = measurementDate ?? new Date();
        const dagen = Math.floor((nextCal.getTime() - ref.getTime()) / DAY_MS);
        if (dagen >= 0 && dagen <= 30) {
          warnings.push({
            code: 'calibration_soon',
            label: `Kalibratie verloopt binnen ${dagen} dagen`,
            fix: 'equipment',
          });
        }
      }
    }

    // Meetstructuur (warnings)
    if (electrodes.length === 0) {
      warnings.push({ code: 'no_electrode', label: 'Geen elektrode toegevoegd', fix: 'measurements' });
    } else {
      electrodes.forEach((el: any) => {
        const pens = el.pens || [];
        if (pens.length === 0) {
          warnings.push({
            code: `electrode_no_pen_${el.id}`,
            label: `${el.electrode_code}: geen pen`,
            fix: 'measurements',
          });
          return;
        }
        pens.forEach((pen: any) => {
          const validMeasurements = (pen.measurements || []).filter(
            (m: any) => typeof m.resistance_value === 'number' && m.resistance_value > 0,
          );
          if (validMeasurements.length === 0) {
            warnings.push({
              code: `pen_no_measurement_${pen.id}`,
              label: `${el.electrode_code} / ${pen.pen_code}: geen meetwaarde`,
              fix: 'measurements',
            });
          }
        });
      });
    }

    // Optionele aanvullingen
    const heeftSchets = attachments.some(
      (a: any) => a.attachment_type === 'sketch_photo' || a.attachment_type === 'sketch_file',
    );
    if (!heeftSchets) {
      warnings.push({ code: 'no_sketch', label: 'Schets ontbreekt', fix: 'measurements' });
    }
    if (!project.notes || String(project.notes).trim() === '') {
      warnings.push({ code: 'no_notes', label: 'Projectnotities ontbreken', fix: 'project' });
    }
    if (client && (!client.email || String(client.email).trim() === '')) {
      warnings.push({ code: 'no_client_email', label: 'E-mail opdrachtgever ontbreekt', fix: 'project' });
    }

    return {
      blockers, // altijd leeg
      warnings,
      isReady: true, // rapport mag altijd
      hasWarnings: warnings.length > 0,
      isLoading: false,
    };
  }, [project, reportData, projectLoading, reportLoading]);
}
