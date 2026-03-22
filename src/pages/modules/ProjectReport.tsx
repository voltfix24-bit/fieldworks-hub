import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Printer, FileText, AlertCircle, PenTool, RotateCcw, Loader2, Download, Mail, X, MessageCircle, FileDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatNlDate } from '@/lib/nl-date';
import { useProject } from '@/hooks/use-projects';
import { useReportData } from '@/hooks/use-report-data';
import { useTenant } from '@/contexts/TenantContext';
import { useAuth } from '@/contexts/AuthContext';
import { ReportHeader } from '@/components/report/ReportHeader';
import { ReportInfoSection } from '@/components/report/ReportInfoSection';
import { ReportElectrodeSection } from '@/components/report/ReportElectrodeSection';
import { ReportFooter } from '@/components/report/ReportFooter';
import { ReadinessChecklist } from '@/components/measurement/ReadinessChecklist';
import { useRapportGenerator } from '@/hooks/useRapportGenerator';
import { useHandtekening } from '@/hooks/useHandtekening';
import { useToast } from '@/hooks/use-toast';
import HandtekeningPad from '@/components/measurement/HandtekeningPad';
import { cn } from '@/lib/utils';

export default function ProjectReport() {
  const { user } = useAuth();
  const [handtekening, setHandtekening] = useState<string | null>(null);
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: project, isLoading: projectLoading } = useProject(id);
  const { data: reportData, isLoading: reportLoading } = useReportData(id);
  const { branding } = useTenant();
  const { genereerViaEdge, isLoading: rapportLoading } = useRapportGenerator();
  const { opgeslagenHandtekening, heeftOpgeslagen } = useHandtekening(user?.id);
  const { toast } = useToast();
  const [gebruikOpgeslagen, setGebruikOpgeslagen] = useState(false);
  const [tekenModus, setTekenModus] = useState<'keuze' | 'opgeslagen' | 'nieuw'>('nieuw');

  // Auto-select saved signature when available
  useEffect(() => {
    if (heeftOpgeslagen && !handtekening) {
      setGebruikOpgeslagen(true);
    }
  }, [heeftOpgeslagen]);

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

  // Determine active signature
  const actieveHandtekening = gebruikOpgeslagen ? opgeslagenHandtekening : handtekening;

  const handleDownload = async () => {
    try {
      await genereerViaEdge(id!, actieveHandtekening ?? undefined);
      toast({ title: 'Rapport gedownload', description: 'Het PDF rapport is succesvol gegenereerd.' });
    } catch (err) {
      toast({ title: 'Rapport generatie mislukt', description: err instanceof Error ? err.message : 'Onbekende fout', variant: 'destructive' });
    }
  };

  // Email state
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailTo, setEmailTo] = useState(client?.email || '');
  const [emailNaam, setEmailNaam] = useState(client?.contact_name || '');
  const [emailSending, setEmailSending] = useState(false);
  const [whatsAppLoading, setWhatsAppLoading] = useState(false);

  const handleSendEmail = async () => {
    if (!emailTo) return;
    setEmailSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-rapport', {
        body: {
          project_id: id,
          handtekening_b64: actieveHandtekening ?? undefined,
          recipient_email: emailTo,
          recipient_name: emailNaam,
        },
      });
      if (error) throw error;
      toast({ title: 'Rapport verstuurd', description: `Verzonden naar ${emailTo}` });
      setEmailOpen(false);
    } catch (err) {
      toast({ title: 'Versturen mislukt', description: err instanceof Error ? err.message : 'Probeer opnieuw', variant: 'destructive' });
    } finally {
      setEmailSending(false);
    }
  };

  const handleWhatsApp = async () => {
    setWhatsAppLoading(true);
    try {
      // Generate PDF and get signed URL
      const { data, error: fnError } = await supabase.functions.invoke('generate-rapport', {
        body: { project_id: id, handtekening_b64: actieveHandtekening ?? undefined },
      });
      if (fnError) throw new Error(fnError.message);

      let rapportUrl = '';
      if (data?.pdf_base64) {
        // Upload to storage and get signed URL
        const binaryStr = atob(data.pdf_base64);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
        
        const pad = `shared/${id}/${Date.now()}_${data.bestandsnaam || 'rapport.pdf'}`;
        const { data: upload, error: uploadErr } = await supabase.storage
          .from('generated-reports')
          .upload(pad, bytes, { contentType: 'application/pdf', upsert: false });
        if (uploadErr) throw uploadErr;
        
        const { data: signedData } = await supabase.storage
          .from('generated-reports')
          .createSignedUrl(upload.path, 86400);
        rapportUrl = signedData?.signedUrl || '';
      }

      const klantNaam = client?.company_name || 'opdrachtgever';
      const projectNaam = project.project_name;
      const datum = formatNlDate(session?.measurement_date);
      
      const bericht = `Geachte ${klantNaam},\n\nHierbij het aardingsrapport voor project "${projectNaam}" (${datum}).\n\n📄 Rapport downloaden:\n${rapportUrl}\n\nMet vriendelijke groet,\n${tech?.full_name || 'Het team'}`;
      const encoded = encodeURIComponent(bericht);

      if (client?.phone) {
        const telefoon = client.phone.replace(/[\s\-\(\)]/g, '').replace(/^0/, '31');
        window.open(`https://wa.me/${telefoon}?text=${encoded}`, '_blank');
      } else {
        window.open(`https://wa.me/?text=${encoded}`, '_blank');
      }

      toast({ title: 'WhatsApp geopend', description: 'Controleer het bericht en verstuur naar de opdrachtgever.' });
    } catch (err) {
      toast({ title: 'Delen mislukt', description: err instanceof Error ? err.message : 'Probeer opnieuw', variant: 'destructive' });
    } finally {
      setWhatsAppLoading(false);
    }
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
              <Printer className="mr-2 h-4 w-4" /> Print / PDF
            </Button>
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

      {/* ─── ONDERTEKENING STAP ─── */}
      {isReady && (
        <div className="print:hidden max-w-lg mx-auto mb-8">
          <div className="rounded-2xl bg-card border border-border/40 p-5 sm:p-6">
            <div className="flex items-center gap-2.5 mb-1">
              <PenTool className="h-4 w-4 text-muted-foreground/50" />
              <h2 className="text-[16px] font-bold text-foreground tracking-tight">Ondertekening</h2>
            </div>
            <p className="text-[12px] text-muted-foreground/50 mb-5">Teken hieronder ter bevestiging</p>

            {/* Saved signature notice */}
            {heeftOpgeslagen && !gebruikOpgeslagen && !handtekening && (
              <div className="rounded-xl bg-muted/20 p-3.5 mb-4 flex items-center justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-foreground">Opgeslagen handtekening beschikbaar</p>
                  <p className="text-[11px] text-muted-foreground/50 mt-0.5">Eerder opgeslagen door deze monteur</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => setGebruikOpgeslagen(true)}
                    className="px-3 py-1.5 rounded-lg text-[11px] font-medium bg-[#F4896B]/10 text-[#F4896B] active:scale-[0.96] transition-all"
                  >
                    Gebruik opgeslagen
                  </button>
                  <button
                    onClick={() => setGebruikOpgeslagen(false)}
                    className="px-3 py-1.5 rounded-lg text-[11px] font-medium bg-muted/30 text-muted-foreground active:scale-[0.96] transition-all"
                  >
                    Opnieuw tekenen
                  </button>
                </div>
              </div>
            )}

            {/* Show saved signature preview */}
            {gebruikOpgeslagen && opgeslagenHandtekening && (
              <div className="mb-4">
                <div className="rounded-xl border border-border bg-white p-3">
                  <img
                    src={`data:image/png;base64,${opgeslagenHandtekening}`}
                    alt="Opgeslagen handtekening"
                    className="w-full h-28 object-contain"
                  />
                </div>
                <button
                  onClick={() => { setGebruikOpgeslagen(false); setHandtekening(null); }}
                  className="mt-2 text-[11px] font-medium text-muted-foreground/50 hover:text-foreground transition-colors flex items-center gap-1"
                >
                  <RotateCcw className="h-3 w-3" />
                  Opnieuw tekenen
                </button>
              </div>
            )}

            {/* Draw new signature */}
            {!gebruikOpgeslagen && (
              <HandtekeningPad
                onChange={setHandtekening}
                breedte={460}
                hoogte={160}
                monteurId={user?.id}
              />
            )}

            {/* Generate + Email buttons */}
            <div className="flex gap-2 mt-5">
              <button
                onClick={handleDownload}
                disabled={!actieveHandtekening || rapportLoading}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 rounded-xl font-semibold text-[14px] py-3 transition-all active:scale-[0.98]',
                  actieveHandtekening
                    ? 'bg-[hsl(var(--tenant-primary))] text-white shadow-sm'
                    : 'bg-muted/30 text-muted-foreground/40 cursor-not-allowed'
                )}
              >
                {rapportLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {rapportLoading ? 'Genereren…' : 'Download'}
              </button>
              <button
                onClick={handleWhatsApp}
                disabled={!actieveHandtekening || whatsAppLoading}
                className={cn(
                  'flex items-center justify-center gap-2 rounded-xl font-semibold text-[14px] py-3 px-4 transition-all active:scale-[0.98]',
                  actieveHandtekening
                    ? 'bg-[#25D366]/10 text-[#25D366]'
                    : 'bg-muted/30 text-muted-foreground/40 cursor-not-allowed'
                )}
              >
                {whatsAppLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
              </button>
              <button
                onClick={() => setEmailOpen(true)}
                disabled={!actieveHandtekening || rapportLoading}
                className={cn(
                  'flex items-center justify-center gap-2 rounded-xl font-semibold text-[14px] py-3 px-4 transition-all active:scale-[0.98]',
                  actieveHandtekening
                    ? 'bg-[hsl(var(--tenant-primary)/0.1)] text-[hsl(var(--tenant-primary))]'
                    : 'bg-muted/30 text-muted-foreground/40 cursor-not-allowed'
                )}
              >
                <Mail className="h-4 w-4" />
              </button>
            </div>

            {/* Email modal */}
            {emailOpen && (
              <div className="mt-4 rounded-xl border border-border/40 bg-muted/10 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-[13px] font-semibold text-foreground">Rapport versturen</h3>
                  <button onClick={() => setEmailOpen(false)} className="text-muted-foreground/40 hover:text-foreground transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground/60">E-mailadres</Label>
                  <Input
                    type="email"
                    value={emailTo}
                    onChange={e => setEmailTo(e.target.value)}
                    placeholder="klant@bedrijf.nl"
                    className="h-9 text-[13px]"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground/60">Naam ontvanger</Label>
                  <Input
                    value={emailNaam}
                    onChange={e => setEmailNaam(e.target.value)}
                    placeholder="Naam"
                    className="h-9 text-[13px]"
                  />
                </div>
                <button
                  onClick={handleSendEmail}
                  disabled={!emailTo || emailSending}
                  className={cn(
                    'w-full flex items-center justify-center gap-2 rounded-xl font-semibold text-[13px] py-2.5 transition-all',
                    emailTo
                      ? 'bg-[hsl(var(--tenant-primary))] text-white'
                      : 'bg-muted/30 text-muted-foreground/40 cursor-not-allowed'
                  )}
                >
                  {emailSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                  {emailSending ? 'Versturen…' : 'Versturen'}
                </button>
              </div>
            )}
          </div>
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
                    <p className="text-[10px] text-muted-foreground mb-2">Uitvoerder</p>
                    <div className="print:hidden">
                      <HandtekeningPad onChange={setHandtekening} breedte={400} hoogte={140} monteurId={user?.id} />
                    </div>
                    {/* Print view: show signature image if available */}
                    <div className="hidden print:block">
                      {actieveHandtekening ? (
                        <img
                          src={`data:image/png;base64,${actieveHandtekening}`}
                          alt="Handtekening"
                          className="w-40 h-16 object-contain"
                        />
                      ) : (
                        <>
                          <div className="border-b border-foreground/20 mb-1 mt-8" />
                          <p className="text-[10px] text-muted-foreground">Naam en handtekening</p>
                        </>
                      )}
                    </div>
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
