import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, FileText, AlertCircle } from 'lucide-react';
import { formatNlDate } from '@/lib/nl-date';
import { useProject } from '@/hooks/use-projects';
import { useReportData } from '@/hooks/use-report-data';
import { ReportHeader } from '@/components/report/ReportHeader';
import { ReportInfoSection } from '@/components/report/ReportInfoSection';
import { ReportSummaryStats } from '@/components/report/ReportSummaryStats';
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

  const location = [project.address_line_1, project.postal_code, project.city, project.country].filter(Boolean).join(', ');
  const sketchAttachments = attachments.filter((a: any) => a.attachment_type === 'sketch_photo' || a.attachment_type === 'sketch_file');

  return (
    <div className="animate-fade-in">
      <div className="print:hidden mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/projects/${id}`)}><ArrowLeft className="mr-2 h-4 w-4" /> Terug naar Project</Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(`/projects/${id}/measurements`)}><FileText className="mr-2 h-4 w-4" /> Metingen bewerken</Button>
          {isReady && <Button size="sm" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" /> Afdrukken / PDF</Button>}
        </div>
      </div>

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

      <div className={`${!isReady ? 'print:hidden opacity-30 pointer-events-none' : ''}`}>
        <div className="report-page max-w-[210mm] mx-auto bg-white p-8 sm:p-12 shadow-sm border border-border rounded-lg print:shadow-none print:border-0 print:rounded-none print:p-0 print:max-w-none">
          <ReportHeader projectName={project.project_name} projectNumber={project.project_number} status={project.status} measurementDate={session?.measurement_date} location={location} />

          <ReportInfoSection title="Projectinformatie" rows={[
            { label: 'Projectnummer', value: project.project_number },
            { label: 'Projectnaam', value: project.project_name },
            { label: 'Locatienaam', value: project.site_name },
            { label: 'Adres', value: project.address_line_1 },
            { label: 'Plaats', value: project.city },
            { label: 'Land', value: project.country },
            { label: 'Geplande Datum', value: project.planned_date },
            { label: 'Afronddatum', value: project.completed_date },
          ]} />

          {client && <ReportInfoSection title="Opdrachtgever" rows={[
            { label: 'Bedrijf', value: client.company_name },
            { label: 'Contact', value: client.contact_name },
            { label: 'E-mail', value: client.email },
            { label: 'Telefoon', value: client.phone },
            { label: 'Adres', value: [client.address_line_1, client.city, client.country].filter(Boolean).join(', ') || null },
          ]} />}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            {tech && <ReportInfoSection title="Monteur" rows={[
              { label: 'Naam', value: tech.full_name },
              { label: 'E-mail', value: tech.email },
              { label: 'Telefoon', value: tech.phone },
              { label: 'Medewerkernr.', value: tech.employee_code },
            ]} />}
            {equip && <ReportInfoSection title="Meetapparatuur" rows={[
              { label: 'Apparaat', value: equip.device_name },
              { label: 'Merk', value: equip.brand },
              { label: 'Model', value: equip.model },
              { label: 'Serienummer', value: equip.serial_number },
              { label: 'Kalibratie', value: equip.calibration_date },
              { label: 'Volgende Kalibratie', value: equip.next_calibration_date },
            ]} />}
          </div>

          <ReportSummaryStats stats={stats} hasSketch={hasSketches} />

          {session?.measurement_notes && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-2 pb-1 border-b border-border">Meetnotities</h2>
              <p className="text-xs text-foreground whitespace-pre-wrap">{session.measurement_notes}</p>
            </div>
          )}

          {electrodes.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4 pb-1 border-b border-border">Meetresultaten</h2>
              {electrodes.map((electrode, i) => <ReportElectrodeSection key={electrode.id} electrode={electrode} index={i} />)}
            </div>
          )}

          {sketchAttachments.length > 0 && (
            <div className="mb-6 page-break-inside-avoid">
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3 pb-1 border-b border-border">Schets / Bijlagen</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {sketchAttachments.map((att: any) => (
                  <div key={att.id}>
                    {att.file_url && <img src={att.file_url} alt={att.file_name || 'Schets'} className="w-full h-auto max-h-64 object-contain rounded border border-border" />}
                    {att.caption && <p className="text-[10px] text-muted-foreground mt-1">{att.caption}</p>}
                    <p className="text-[10px] text-muted-foreground capitalize">{att.attachment_type.replace('_', ' ')}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {project.notes && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-2 pb-1 border-b border-border">Projectnotities</h2>
              <p className="text-xs text-foreground whitespace-pre-wrap">{project.notes}</p>
            </div>
          )}

          <ReportFooter />
        </div>
      </div>
    </div>
  );
}
