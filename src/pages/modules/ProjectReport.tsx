import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, FileText, AlertCircle } from 'lucide-react';
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

  if (projectLoading || reportLoading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  if (!project) {
    return <p className="text-muted-foreground text-center py-12">Project not found</p>;
  }

  const client = project.clients as any;
  const tech = project.technicians as any;
  const equip = project.equipment as any;

  const session = reportData?.session;
  const electrodes = reportData?.electrodes || [];
  const attachments = reportData?.attachments || [];
  const stats = reportData?.stats || { electrodeCount: 0, penCount: 0, measurementCount: 0, photosCount: 0 };

  // Readiness checks
  const hasSession = !!session;
  const hasClient = !!client;
  const hasTechnician = !!tech;
  const hasEquipment = !!equip;
  const hasElectrodes = electrodes.length > 0;
  const hasMeasurements = stats.measurementCount > 0;
  const hasSketches = attachments.some((a: any) => a.attachment_type === 'sketch_photo' || a.attachment_type === 'sketch_file');

  const isReady = hasSession && hasClient && hasTechnician && hasEquipment && hasElectrodes && hasMeasurements;

  const readinessItems = [
    { label: 'Measurement session exists', met: hasSession },
    { label: 'Client assigned', met: hasClient },
    { label: 'Technician assigned', met: hasTechnician },
    { label: 'Equipment assigned', met: hasEquipment },
    { label: 'At least one electrode', met: hasElectrodes },
    { label: 'At least one measurement', met: hasMeasurements },
    { label: 'Sketch attached', met: hasSketches, optional: true },
  ];

  const location = [project.address_line_1, project.postal_code, project.city, project.country].filter(Boolean).join(', ');

  const sketchAttachments = attachments.filter((a: any) => a.attachment_type === 'sketch_photo' || a.attachment_type === 'sketch_file');

  return (
    <div className="animate-fade-in">
      {/* Toolbar — hidden when printing */}
      <div className="print:hidden mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/projects/${id}`)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Project
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(`/projects/${id}/measurements`)}>
            <FileText className="mr-2 h-4 w-4" /> Edit Measurements
          </Button>
          {isReady && (
            <Button size="sm" onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" /> Print / Export PDF
            </Button>
          )}
        </div>
      </div>

      {/* Not ready state */}
      {!isReady && (
        <div className="print:hidden max-w-lg mx-auto mb-8">
          <div className="flex items-center gap-3 mb-4 p-4 rounded-lg border border-orange-200 bg-orange-50">
            <AlertCircle className="h-5 w-5 text-orange-500 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Report not ready</p>
              <p className="text-xs text-muted-foreground mt-0.5">Complete the following items before generating the report.</p>
            </div>
          </div>
          <ReadinessChecklist items={readinessItems} />
        </div>
      )}

      {/* Report content — always render for print, visually gated on screen */}
      <div className={`${!isReady ? 'print:hidden opacity-30 pointer-events-none' : ''}`}>
        <div className="report-page max-w-[210mm] mx-auto bg-white p-8 sm:p-12 shadow-sm border border-border rounded-lg print:shadow-none print:border-0 print:rounded-none print:p-0 print:max-w-none">

          <ReportHeader
            projectName={project.project_name}
            projectNumber={project.project_number}
            status={project.status}
            measurementDate={session?.measurement_date}
            location={location}
          />

          {/* Project info */}
          <ReportInfoSection
            title="Project Information"
            rows={[
              { label: 'Project Number', value: project.project_number },
              { label: 'Project Name', value: project.project_name },
              { label: 'Site Name', value: project.site_name },
              { label: 'Address', value: project.address_line_1 },
              { label: 'City', value: project.city },
              { label: 'Country', value: project.country },
              { label: 'Planned Date', value: project.planned_date },
              { label: 'Completed Date', value: project.completed_date },
            ]}
          />

          {/* Client */}
          {client && (
            <ReportInfoSection
              title="Client / Opdrachtgever"
              rows={[
                { label: 'Company', value: client.company_name },
                { label: 'Contact', value: client.contact_name },
                { label: 'Email', value: client.email },
                { label: 'Phone', value: client.phone },
                { label: 'Address', value: [client.address_line_1, client.city, client.country].filter(Boolean).join(', ') || null },
              ]}
            />
          )}

          {/* Technician & Equipment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            {tech && (
              <ReportInfoSection
                title="Technician"
                rows={[
                  { label: 'Name', value: tech.full_name },
                  { label: 'Email', value: tech.email },
                  { label: 'Phone', value: tech.phone },
                  { label: 'Employee Code', value: tech.employee_code },
                ]}
              />
            )}
            {equip && (
              <ReportInfoSection
                title="Measuring Equipment"
                rows={[
                  { label: 'Device', value: equip.device_name },
                  { label: 'Brand', value: equip.brand },
                  { label: 'Model', value: equip.model },
                  { label: 'Serial Number', value: equip.serial_number },
                  { label: 'Calibration', value: equip.calibration_date },
                  { label: 'Next Calibration', value: equip.next_calibration_date },
                ]}
              />
            )}
          </div>

          {/* Summary stats */}
          <ReportSummaryStats stats={stats} hasSketch={hasSketches} />

          {/* Measurement notes */}
          {session?.measurement_notes && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-2 pb-1 border-b border-border">Measurement Notes</h2>
              <p className="text-xs text-foreground whitespace-pre-wrap">{session.measurement_notes}</p>
            </div>
          )}

          {/* Detailed electrodes */}
          {electrodes.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4 pb-1 border-b border-border">Measurement Results</h2>
              {electrodes.map((electrode, i) => (
                <ReportElectrodeSection key={electrode.id} electrode={electrode} index={i} />
              ))}
            </div>
          )}

          {/* Sketch section */}
          {sketchAttachments.length > 0 && (
            <div className="mb-6 page-break-inside-avoid">
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3 pb-1 border-b border-border">Sketch / Attachments</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {sketchAttachments.map((att: any) => (
                  <div key={att.id}>
                    {att.file_url && (
                      <img src={att.file_url} alt={att.file_name || 'Sketch'} className="w-full h-auto max-h-64 object-contain rounded border border-border" />
                    )}
                    {att.caption && <p className="text-[10px] text-muted-foreground mt-1">{att.caption}</p>}
                    <p className="text-[10px] text-muted-foreground capitalize">{att.attachment_type.replace('_', ' ')}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Project notes */}
          {project.notes && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-2 pb-1 border-b border-border">Project Notes</h2>
              <p className="text-xs text-foreground whitespace-pre-wrap">{project.notes}</p>
            </div>
          )}

          <ReportFooter />
        </div>
      </div>
    </div>
  );
}
