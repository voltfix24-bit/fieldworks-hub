import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, FileText, AlertCircle } from 'lucide-react';
import { formatNlDate } from '@/lib/nl-date';
import { useProject } from '@/hooks/use-projects';
import { useReportData } from '@/hooks/use-report-data';
import { ReportHeader } from '@/components/report/ReportHeader';
import { ReportInfoSection } from '@/components/report/ReportInfoSection';

import { ReportElectrodeSection } from '@/components/report/ReportElectrodeSection';
import { ReportFooter } from '@/components/report/ReportFooter';
import { ReadinessChecklist } from '@/components/measurement/ReadinessChecklist';

export default function ProjectReport() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: project, isLoading: projectLoading } = useProject(id);
  const { data: reportData, isLoading: reportLoading } = useReportData(id);

  if (projectLoading || reportLoading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (!project) return <p className="text-muted-foreground text-center py-12">Project niet gevonden</p>;

  const client = project.clients as any;
  const tech = project.technicians as any;
  const equip = project.equipment as any;
  const session = reportData?.session;
  const electrodes = reportData?.electrodes || [];
  const attachments = reportData?.attachments || [];
  const stats = reportData?.stats || { electrodeCount: 0, penCount: 0, measurementCount: 0, photosCount: 0 };

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

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = `Rapport ${project.project_number} - ${project.project_name}`;
    window.print();
    setTimeout(() => { document.title = originalTitle; }, 1000);
  };

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
            <Button size="sm" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" /> Rapport exporteren
            </Button>
          )}
        </div>
      </div>

      {/* Readiness gate — hidden in print */}
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

          {/* 2. Projectgegevens + Opdrachtgever side by side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 page-break-inside-avoid">
            <ReportInfoSection title="Projectgegevens" rows={[
              { label: 'Projectnummer', value: project.project_number },
              { label: 'Projectnaam', value: project.project_name },
              { label: 'Locatie', value: project.site_name },
              { label: 'Adres', value: location || null },
              { label: 'Meetdatum', value: formatNlDate(session?.measurement_date, 'long') },
            ]} />

            {client && (
              <ReportInfoSection title="Opdrachtgever" rows={[
                { label: 'Bedrijf', value: client.company_name },
                { label: 'Contactpersoon', value: client.contact_name },
              ]} />
            )}
          </div>

          {/* 3. Monteur + Meetapparatuur side by side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 page-break-inside-avoid">
            {tech && (
              <ReportInfoSection title="Monteur" rows={[
                { label: 'Naam', value: tech.full_name },
                { label: 'Medewerkernr.', value: tech.employee_code },
              ]} />
            )}
            {equip && (
              <ReportInfoSection title="Meetapparatuur" rows={[
                { label: 'Apparaat', value: equip.device_name },
                { label: 'Merk / Model', value: [equip.brand, equip.model].filter(Boolean).join(' ') || null },
                { label: 'Serienummer', value: equip.serial_number },
                { label: 'Kalibratiedatum', value: formatNlDate(equip.calibration_date) },
                { label: 'Volgende kalibratie', value: formatNlDate(equip.next_calibration_date) },
              ]} />
            )}
          </div>

          {/* 4. Compact inline summary — not a separate section */}
          {(stats.electrodeCount > 0 || stats.penCount > 0 || stats.measurementCount > 0) && (
            <div className="mb-6 flex flex-wrap gap-x-6 gap-y-1 text-[11px] text-muted-foreground page-break-inside-avoid">
              {stats.electrodeCount > 0 && <span><strong className="text-foreground font-semibold">{stats.electrodeCount}</strong> elektrode{stats.electrodeCount !== 1 ? 's' : ''}</span>}
              {stats.penCount > 0 && <span><strong className="text-foreground font-semibold">{stats.penCount}</strong> {stats.penCount === 1 ? 'pen' : 'pennen'}</span>}
              {stats.measurementCount > 0 && <span><strong className="text-foreground font-semibold">{stats.measurementCount}</strong> metingen</span>}
            </div>
          )}

          {/* 5. Meetnotities — only if present */}
          {session?.measurement_notes && (
            <div className="mb-6 page-break-inside-avoid">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-foreground mb-2 pb-1.5 border-b border-foreground/12">Opmerkingen</h2>
              <p className="text-[11px] text-foreground whitespace-pre-wrap leading-relaxed">{session.measurement_notes}</p>
            </div>
          )}

          {/* 6. Meetresultaten */}
          {electrodes.length > 0 && (
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
                />
              ))}
            </div>
          )}

          {/* 7. Situatieschets — only if present */}
          {sketchAttachments.length > 0 && (
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

          {/* 8. Projectnotities — only if present */}
          {project.notes && (
            <div className="mb-6 page-break-inside-avoid">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-foreground mb-2 pb-1.5 border-b border-foreground/12">Projectnotities</h2>
              <p className="text-[11px] text-foreground whitespace-pre-wrap leading-relaxed">{project.notes}</p>
            </div>
          )}

          {/* 9. Footer */}
          <ReportFooter />
        </div>
      </div>
    </div>
  );
}
