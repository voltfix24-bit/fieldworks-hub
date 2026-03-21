import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, FileText, AlertCircle } from 'lucide-react';
import { formatNlDate } from '@/lib/nl-date';
import { useProject } from '@/hooks/use-projects';
import { useReportData } from '@/hooks/use-report-data';
import { useTenant } from '@/contexts/TenantContext';
import { ReportHeader } from '@/components/report/ReportHeader';
import { ReportInfoSection } from '@/components/report/ReportInfoSection';
import { ReportElectrodeSection } from '@/components/report/ReportElectrodeSection';
import { ReportFooter } from '@/components/report/ReportFooter';
import { ReadinessChecklist } from '@/components/measurement/ReadinessChecklist';
import { RapportDownloadButton } from '@/components/report/RapportDownloadButton';
import HandtekeningPad from '@/components/measurement/HandtekeningPad';

export default function ProjectReport() {
  const [handtekening, setHandtekening] = useState<string | null>(null);
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: project, isLoading: projectLoading } = useProject(id);
  const { data: reportData, isLoading: reportLoading } = useReportData(id);
  const { branding } = useTenant();

  if (projectLoading || reportLoading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (!project) return <p className="text-muted-foreground text-center py-12">Project niet gevonden</p>;

  const client = project.clients as any;
  const tech = project.technicians as any;
  const equip = project.equipment as any;
  const session = reportData?.session;
  const electrodes = reportData?.electrodes || [];
  const attachments = reportData?.attachments || [];
  const stats = reportData?.stats || { electrodeCount: 0, penCount: 0, measurementCount: 0, photosCount: 0 };

  // Report settings from branding
  const rs = (branding as any) || {};
  const sections: Record<string, boolean> = rs.report_sections || {};
  const fields: Record<string, boolean> = rs.report_fields || {};
  const sec = (key: string) => sections[key] !== false;
  const fld = (key: string) => fields[key] !== false;
  const emptyCellChar = rs.report_empty_cell || '—';

  const hasSession = !!session;
  const hasClient = !!client;
  const hasTechnician = !!tech;
  const hasEquipment = !!equip;
  const hasElectrodes = electrodes.length > 0;
  const hasMeasurements = stats.measurementCount > 0;
  const hasSketches = attachments.some((a: any) => a.attachment_type === 'sketch_photo' || a.attachment_type === 'sketch_file');
  const isReady = hasSession && hasClient && hasTechnician && hasEquipment && hasElectrodes && hasMeasurements;

  const readinessItems = [
    { label: 'Meetsessie aanwezig', met: hasSession },
    { label: 'Klant toegewezen', met: hasClient },
    { label: 'Monteur toegewezen', met: hasTechnician },
    { label: 'Apparatuur toegewezen', met: hasEquipment },
    { label: 'Minimaal één elektrode', met: hasElectrodes },
    { label: 'Minimaal één meting', met: hasMeasurements },
    { label: 'Schets bijgevoegd', met: hasSketches, optional: true },
  ];

  const location = [project.address_line_1, project.postal_code, project.city].filter(Boolean).join(', ');
  const sketchAttachments = attachments.filter((a: any) => a.attachment_type === 'sketch_photo' || a.attachment_type === 'sketch_file');

  // Build export filename from pattern
  const buildFilename = () => {
    const pattern = rs.export_filename_pattern || 'Rapport [projectnummer] - [projectnaam]';
    const dateStr = session?.measurement_date
      ? formatNlDate(session.measurement_date) || ''
      : '';
    return pattern
      .replace(/\[projectnummer\]/g, project.project_number || '')
      .replace(/\[projectnaam\]/g, project.project_name || '')
      .replace(/\[datum\]/g, dateStr)
      .replace(/\[opdrachtgever\]/g, client?.company_name || '');
  };

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = buildFilename();
    window.print();
    setTimeout(() => { document.title = originalTitle; }, 1000);
  };

  // Build conditional row arrays
  const projectRows = [
    fld('projectnummer') && { label: 'Projectnummer', value: project.project_number },
    fld('projectnaam') && { label: 'Projectnaam', value: project.project_name },
    { label: 'Locatie', value: project.site_name },
    fld('adres') && { label: 'Adres', value: location || null },
    fld('meetdatum') && { label: 'Meetdatum', value: formatNlDate(session?.measurement_date, 'long') },
  ].filter(Boolean) as { label: string; value: string | null | undefined }[];

  const clientRows = [
    fld('opdrachtgever_bedrijf') && { label: 'Bedrijf', value: client?.company_name },
    fld('opdrachtgever_contact') && { label: 'Contactpersoon', value: client?.contact_name },
    fld('opdrachtgever_email') && { label: 'E-mail', value: client?.email },
    fld('opdrachtgever_telefoon') && { label: 'Telefoon', value: client?.phone },
  ].filter(Boolean) as { label: string; value: string | null | undefined }[];

  const techRows = [
    fld('monteur_naam') && { label: 'Naam', value: tech?.full_name },
    fld('monteur_code') && { label: 'Medewerkernr.', value: tech?.employee_code },
  ].filter(Boolean) as { label: string; value: string | null | undefined }[];

  const equipRows = [
    fld('apparaat_naam') && { label: 'Apparaat', value: equip?.device_name },
    fld('apparaat_merk') && { label: 'Merk / Model', value: [equip?.brand, equip?.model].filter(Boolean).join(' ') || null },
    fld('apparaat_serienummer') && { label: 'Serienummer', value: equip?.serial_number },
    fld('apparaat_kalibratie') && { label: 'Kalibratiedatum', value: formatNlDate(equip?.calibration_date) },
    fld('apparaat_volgende_kalibratie') && { label: 'Volgende kalibratie', value: formatNlDate(equip?.next_calibration_date) },
  ].filter(Boolean) as { label: string; value: string | null | undefined }[];

  const showSignBlock = rs.report_sign_block === true && sec('ondertekening');

  return (
    <div className="animate-fade-in">
      {/* Toolbar — hidden in print */}
      <div className="print:hidden mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/projects/${id}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Terug
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(`/projects/${id}/measurements`)}>
            <FileText className="mr-2 h-4 w-4" /> Metingen
          </Button>
          {isReady && (
            <>
              <RapportDownloadButton projectId={id!} />
              <Button size="sm" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" /> Print / PDF
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Readiness gate */}
      {!isReady && (
        <div className="print:hidden max-w-lg mx-auto mb-8">
          <div className="flex items-center gap-3 mb-4 p-4 rounded-lg border border-orange-200 bg-orange-50">
            <AlertCircle className="h-5 w-5 text-orange-500 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Rapport niet gereed</p>
              <p className="text-xs text-muted-foreground mt-0.5">Voltooi de volgende onderdelen om het rapport te genereren.</p>
            </div>
          </div>
          <ReadinessChecklist items={readinessItems} />
        </div>
      )}

      {/* ─── REPORT DOCUMENT ─── */}
      <div className={`${!isReady ? 'print:hidden opacity-30 pointer-events-none' : ''}`}>
        <div className="report-document max-w-[210mm] mx-auto bg-white px-10 py-10 sm:px-14 sm:py-12 shadow-sm border border-border/60 print:shadow-none print:border-0 print:p-0 print:max-w-none"
             style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>

          {/* 1. Header */}
          <ReportHeader
            projectName={project.project_name}
            projectNumber={project.project_number}
            measurementDate={session?.measurement_date}
            location={location}
          />

          {/* 2. Projectgegevens + Opdrachtgever */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 page-break-inside-avoid">
            {sec('projectgegevens') && (
              <ReportInfoSection title="Projectgegevens" rows={projectRows} />
            )}
            {sec('opdrachtgever') && client && (
              <ReportInfoSection title="Opdrachtgever" rows={clientRows} />
            )}
          </div>

          {/* 3. Monteur + Meetapparatuur */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 page-break-inside-avoid">
            {sec('monteur') && tech && (
              <ReportInfoSection title="Monteur" rows={techRows} />
            )}
            {sec('meetapparatuur') && equip && (
              <ReportInfoSection title="Meetapparatuur" rows={equipRows} />
            )}
          </div>

          {/* 4. Meetnotities */}
          {sec('notities') && session?.measurement_notes && (
            <div className="mb-6 page-break-inside-avoid">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-foreground mb-2 pb-1.5 border-b border-foreground/12">Opmerkingen</h2>
              <p className="text-[11px] text-foreground whitespace-pre-wrap leading-relaxed">{session.measurement_notes}</p>
            </div>
          )}

          {/* 5. Meetresultaten */}
          {sec('meetresultaten') && electrodes.length > 0 && (
            <div className="mb-8">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-foreground mb-5 pb-2 border-b-2 border-foreground/20">
                Meetresultaten
              </h2>
              {electrodes.map((electrode, i) => (
                <ReportElectrodeSection
                  key={electrode.id}
                  electrode={electrode}
                  index={i}
                  totalElectrodes={electrodes.length}
                  showPhotos={sec('fotos')}
                  emptyCellChar={emptyCellChar}
                />
              ))}
            </div>
          )}

          {/* 6. Situatieschets */}
          {sec('schets') && sketchAttachments.length > 0 && (
            <div className="mb-8 page-break-inside-avoid">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-foreground mb-3 pb-1.5 border-b border-foreground/12">
                Situatieschets
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {sketchAttachments.map((att: any) => (
                  <figure key={att.id} className="page-break-inside-avoid">
                    {att.file_url && (
                      <img src={att.file_url} alt={att.file_name || 'Schets'} className="w-full h-auto max-h-56 object-contain border border-foreground/8 print:max-h-44" />
                    )}
                    {att.caption && <figcaption className="text-[10px] text-muted-foreground mt-1 italic">{att.caption}</figcaption>}
                  </figure>
                ))}
              </div>
            </div>
          )}

          {/* 7. Projectnotities */}
          {sec('notities') && project.notes && (
            <div className="mb-6 page-break-inside-avoid">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-foreground mb-2 pb-1.5 border-b border-foreground/12">Projectnotities</h2>
              <p className="text-[11px] text-foreground whitespace-pre-wrap leading-relaxed">{project.notes}</p>
            </div>
          )}

          {/* 8. Signing block */}
          {showSignBlock && (
            <div className="mb-6 page-break-inside-avoid">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-foreground mb-4 pb-1.5 border-b border-foreground/12">Ondertekening</h2>
              <div className="grid grid-cols-2 gap-8">
                {rs.report_sign_executor !== false && (
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-8">Uitvoerder</p>
                    <div className="border-b border-foreground/20 mb-1" />
                    <p className="text-[10px] text-muted-foreground">Naam en handtekening</p>
                  </div>
                )}
                {rs.report_sign_reviewer === true && (
                  <div>
                    <p className="text-[10px] text-muted-foreground mb-8">Controleur</p>
                    <div className="border-b border-foreground/20 mb-1" />
                    <p className="text-[10px] text-muted-foreground">Naam en handtekening</p>
                  </div>
                )}
              </div>
              {rs.report_sign_date !== false && (
                <p className="text-[10px] text-muted-foreground mt-4">Datum: ____________________</p>
              )}
            </div>
          )}

          {/* 9. Disclaimer */}
          {rs.report_disclaimer && (
            <div className="mb-6 page-break-inside-avoid">
              <p className="text-[9px] text-muted-foreground italic leading-relaxed">{rs.report_disclaimer}</p>
            </div>
          )}

          {/* 10. Footer */}
          <ReportFooter />
        </div>
      </div>
    </div>
  );
}
